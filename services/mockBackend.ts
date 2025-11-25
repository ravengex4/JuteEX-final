import { Machine, MachineMode, RunLog } from '../types';
import { SAMPLE_MACHINES } from '../constants';

const STORAGE_KEY = 'juteex_state_v4';

// Helper for IDs
const uuid = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

class MockBackend {
  private machines: Machine[] = [...SAMPLE_MACHINES];
  private runLogs: RunLog[] = [];
  private listeners: ((data: { machines: Machine[], runLogs: RunLog[] }) => void)[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private intervalId: any;

  constructor() {
    this.loadState();
    this.startTelemetrySimulation();
  }

  // Load from LocalStorage
  private loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.machines = parsed.machines || [...SAMPLE_MACHINES];
        this.runLogs = parsed.runLogs || [];
      }
    } catch (e) {
      console.warn("Failed to load JuteEX state", e);
    }
  }

  // Save to LocalStorage
  private saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        machines: this.machines,
        runLogs: this.runLogs
      }));
    } catch (e) {
      console.error("Failed to save state", e);
    }
  }

  public subscribe(listener: (data: { machines: Machine[], runLogs: RunLog[] }) => void) {
    this.listeners.push(listener);
    listener({ machines: this.machines, runLogs: this.runLogs });
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l({ machines: this.machines, runLogs: this.runLogs }));
  }

  // Simulate MQTT incoming data
  private startTelemetrySimulation() {
    this.intervalId = setInterval(() => {
      this.machines = this.machines.map(m => {
        if (m.status === 'RUNNING') {
          // Physics simulation
          // Random fluctuation
          const jitter = (Math.random() - 0.5) * 2;
          
          // Calculate RPM
          const rpm = Math.max(0, Math.min(3000, m.telemetry.rpm + (jitter * 30)));

          // RPM-Based Mode Switching Logic
          // If in POWER mode and RPM drops below 50, switch to ECO
          let currentMode = m.currentMode;
          if (currentMode === MachineMode.POWER && rpm < 50) {
            currentMode = MachineMode.ECO;
          }

          // Simulate Heat and Efficiency
          const heatRise = (m.telemetry.speed / 100) * 0.2; 
          const temp = Math.min(95, Math.max(20, m.telemetry.motorTemp + heatRise + (jitter * 0.05)));
          
          const effBase = 100 - (Math.abs(m.telemetry.speed - 65) * 0.5);
          const eff = Math.min(100, Math.max(70, effBase + jitter));

          // Simulate Current
          let ampsBase = 2 + ((m.telemetry.speed / 100) * 10); 
          if (currentMode === MachineMode.POWER) ampsBase *= 1.25;
          if (currentMode === MachineMode.ECO) ampsBase *= 0.85;
          const amps = Math.max(0.5, ampsBase + (jitter * 0.5));

          // Update metrics
          return {
            ...m,
            currentMode,
            telemetry: {
              ...m.telemetry,
              rpm: rpm, 
              motorTemp: temp,
              runtime: m.telemetry.runtime + 1,
              connectionStatus: 'LIVE',
              efficiency: Math.round(eff),
              current: parseFloat(amps.toFixed(1)),
              lastSeen: Date.now()
            }
          } as Machine;
        } else {
          // Cooling down
          return {
            ...m,
            telemetry: {
              ...m.telemetry,
              rpm: Math.max(0, m.telemetry.rpm - 150), 
              motorTemp: Math.max(20, m.telemetry.motorTemp - 0.2), 
              current: 0,
              // Keep status LIVE if recently seen, else cached. 
              connectionStatus: 'LIVE', 
              lastSeen: Date.now()
            }
          } as Machine;
        }
      });
      
      this.notify();
    }, 1000);

    // Save periodically
    setInterval(() => this.saveState(), 5000);
  }

  public toggleMachineState(id: string) {
    const machine = this.machines.find(m => m.id === id);
    if (!machine) return;

    if (machine.status === 'RUNNING') {
        // Stop logic -> Create Log
        this.machines = this.machines.map(m => m.id === id ? { ...m, status: 'STOPPED' } : m);
        
        const log: RunLog = {
            id: uuid(),
            machineId: machine.id,
            machineName: machine.name,
            startTime: Date.now() - (machine.telemetry.runtime * 1000),
            endTime: Date.now(),
            duration: machine.telemetry.runtime,
            mode: machine.currentMode,
            jams: machine.telemetry.jams,
            avgSpeed: machine.telemetry.speed, 
            avgEfficiency: machine.telemetry.efficiency,
            date: new Date().toISOString()
        };
        this.runLogs = [log, ...this.runLogs];
        
        // Reset runtime on stop
        this.machines = this.machines.map(m => m.id === id ? { 
            ...m, 
            telemetry: { ...m.telemetry, runtime: 0, rpm: 0, speed: 0 } 
        } : m);

    } else {
        // Start logic
        this.machines = this.machines.map(m => m.id === id ? { 
            ...m, 
            status: 'RUNNING',
            telemetry: { ...m.telemetry, runtime: 0, speed: 20, rpm: 500 } // kickstart
        } : m);
    }
    
    this.notify();
    this.saveState();
  }

  public setMode(id: string, mode: MachineMode) {
    this.machines = this.machines.map(m => m.id === id ? { ...m, currentMode: mode } : m);
    this.notify();
    this.saveState();
  }

  public setSpeed(id: string, speed: number) {
    this.machines = this.machines.map(m => m.id === id ? { 
        ...m, 
        telemetry: { ...m.telemetry, speed: speed } 
    } : m);
    this.notify();
  }

  public triggerAntiJam(id: string) {
      this.machines = this.machines.map(m => {
          if (m.id === id) {
              return {
                  ...m,
                  telemetry: {
                      ...m.telemetry,
                      jams: m.telemetry.jams + 1,
                      lastAntiJam: Date.now()
                  }
              };
          }
          return m;
      });
      this.notify();
      this.saveState();
  }

  public async startRental(machineId: string, duration: number, unit: 'HOURS' | 'DAYS') {
      // Simulate async network call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.machines = this.machines.map(m => {
          if (m.id === machineId) {
              return {
                  ...m,
                  rentalSession: {
                      startTime: Date.now(),
                      duration,
                      durationUnit: unit,
                      renterId: 'temp-renter'
                  }
              };
          }
          return m;
      });
      this.notify();
      this.saveState();
  }
}

export const mockBackend = new MockBackend();