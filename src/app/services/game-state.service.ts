import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface GameStats {
  elementsDiscovered: number;
  totalElements: number;
  combinationsAttempted: number;
  successfulCombinations: number;
  gameStartTime: number;
  totalPlayTime: number;
  achievementsUnlocked: string[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  condition: (stats: GameStats, discoveredElements: Set<string>) => boolean;
}

export interface GameState {
  discoveredElements: Set<string>;
  stats: GameStats;
  achievements: Achievement[];
  combinationHistory: Array<{
    elements: string[];
    result: string | null;
    timestamp: number;
  }>;
}

@Injectable({ providedIn: 'root' })
export class GameStateService {
  private readonly STORAGE_KEY = 'alquimia_game_state';
  
  private gameStateSubject = new BehaviorSubject<GameState>(this.getInitialState());
  public gameState$ = this.gameStateSubject.asObservable();

  private achievements: Achievement[] = [];

  constructor() {
    this.achievements = [
      {
        id: 'first_discovery',
        name: 'Primer Descubrimiento',
        description: 'Descubre tu primer elemento',
        icon: '🔍',
        unlocked: false,
        condition: (stats) => stats.elementsDiscovered >= 1
      },
      {
        id: 'element_collector',
        name: 'Coleccionista',
        description: 'Descubre 10 elementos',
        icon: '📚',
        unlocked: false,
        condition: (stats) => stats.elementsDiscovered >= 10
      },
      {
        id: 'master_alchemist',
        name: 'Maestro Alquimista',
        description: 'Descubre 25 elementos',
        icon: '🧙‍♂️',
        unlocked: false,
        condition: (stats) => stats.elementsDiscovered >= 25
      },
      {
        id: 'element_master',
        name: 'Maestro de Elementos',
        description: 'Descubre 50 elementos',
        icon: '👑',
        unlocked: false,
        condition: (stats) => stats.elementsDiscovered >= 50
      },
      {
        id: 'grand_master',
        name: 'Gran Maestro',
        description: 'Descubre todos los elementos',
        icon: '⭐',
        unlocked: false,
        condition: (stats) => stats.elementsDiscovered >= stats.totalElements
      },
      {
        id: 'experimenter',
        name: 'Experimentador',
        description: 'Intenta 50 combinaciones',
        icon: '🧪',
        unlocked: false,
        condition: (stats) => stats.combinationsAttempted >= 50
      },
      {
        id: 'persistent',
        name: 'Persistente',
        description: 'Intenta 100 combinaciones',
        icon: '💪',
        unlocked: false,
        condition: (stats) => stats.combinationsAttempted >= 100
      },
      {
        id: 'efficient',
        name: 'Eficiente',
        description: 'Logra 80% de éxito en combinaciones (min. 20 intentos)',
        icon: '🎯',
        unlocked: false,
        condition: (stats) => stats.combinationsAttempted >= 20 && 
          (stats.successfulCombinations / stats.combinationsAttempted) >= 0.8
      },
      {
        id: 'time_traveler',
        name: 'Viajero del Tiempo',
        description: 'Descubre el elemento "tiempo"',
        icon: '⏰',
        unlocked: false,
        condition: (_, discovered) => discovered.has('tiempo')
      },
      {
        id: 'life_creator',
        name: 'Creador de Vida',
        description: 'Descubre el elemento "vida"',
        icon: '🌱',
        unlocked: false,
        condition: (_, discovered) => discovered.has('vida')
      },
      {
        id: 'universe_builder',
        name: 'Constructor del Universo',
        description: 'Descubre el elemento "universo"',
        icon: '🌌',
        unlocked: false,
        condition: (_, discovered) => discovered.has('universo')
      },
      {
        id: 'speed_runner',
        name: 'Velocista',
        description: 'Descubre 10 elementos en menos de 5 minutos',
        icon: '⚡',
        unlocked: false,
        condition: (stats) => stats.elementsDiscovered >= 10 && 
          stats.totalPlayTime < 5 * 60 * 1000
      }
    ];
    
    this.loadGameState();
    this.startTimeTracking();
  }

  private getInitialState(): GameState {
    const defaultAchievements: Achievement[] = [
      {
        id: 'first_discovery',
        name: 'Primer Descubrimiento',
        description: 'Descubre tu primer elemento',
        icon: '🔍',
        unlocked: false,
        condition: (stats) => stats.elementsDiscovered >= 1
      },
      {
        id: 'element_collector',
        name: 'Coleccionista',
        description: 'Descubre 10 elementos',
        icon: '📚',
        unlocked: false,
        condition: (stats) => stats.elementsDiscovered >= 10
      },
      {
        id: 'master_alchemist',
        name: 'Maestro Alquimista',
        description: 'Descubre 25 elementos',
        icon: '🧙‍♂️',
        unlocked: false,
        condition: (stats) => stats.elementsDiscovered >= 25
      }
    ];

    return {
      discoveredElements: new Set(['fuego', 'agua', 'aire', 'tierra']),
      stats: {
        elementsDiscovered: 4,
        totalElements: 0,
        combinationsAttempted: 0,
        successfulCombinations: 0,
        gameStartTime: Date.now(),
        totalPlayTime: 0,
        achievementsUnlocked: []
      },
      achievements: defaultAchievements,
      combinationHistory: []
    };
  }

  private startTimeTracking(): void {
    let lastUpdate = Date.now();
    setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastUpdate;
      lastUpdate = now;
      
      const currentState = this.gameStateSubject.value;
      currentState.stats.totalPlayTime += elapsed;
      this.saveGameState();
    }, 10000); // Update every 10 seconds
  }

  discoverElement(elementType: string): void {
    const currentState = this.gameStateSubject.value;
    if (!currentState.discoveredElements.has(elementType)) {
      currentState.discoveredElements.add(elementType);
      currentState.stats.elementsDiscovered++;
      this.checkAchievements();
      this.gameStateSubject.next(currentState);
      this.saveGameState();
    }
  }

  recordCombination(elements: string[], result: string | null): void {
    const currentState = this.gameStateSubject.value;
    currentState.stats.combinationsAttempted++;
    if (result) {
      currentState.stats.successfulCombinations++;
    }
    
    currentState.combinationHistory.unshift({
      elements: [...elements],
      result,
      timestamp: Date.now()
    });

    // Keep only last 100 combinations
    if (currentState.combinationHistory.length > 100) {
      currentState.combinationHistory = currentState.combinationHistory.slice(0, 100);
    }

    this.checkAchievements();
    this.gameStateSubject.next(currentState);
    this.saveGameState();
  }

  setTotalElements(total: number): void {
    const currentState = this.gameStateSubject.value;
    currentState.stats.totalElements = total;
    this.gameStateSubject.next(currentState);
    this.saveGameState();
  }

  private checkAchievements(): void {
    const currentState = this.gameStateSubject.value;
    let newAchievements = false;

    for (const achievement of currentState.achievements) {
      if (!achievement.unlocked && 
          achievement.condition(currentState.stats, currentState.discoveredElements)) {
        achievement.unlocked = true;
        currentState.stats.achievementsUnlocked.push(achievement.id);
        newAchievements = true;
        console.log(`🏆 ¡Logro desbloqueado! ${achievement.name}: ${achievement.description}`);
      }
    }

    if (newAchievements) {
      this.gameStateSubject.next(currentState);
      this.saveGameState();
    }
  }

  isElementDiscovered(elementType: string): boolean {
    return this.gameStateSubject.value.discoveredElements.has(elementType);
  }

  getGameStats(): GameStats {
    return { ...this.gameStateSubject.value.stats };
  }

  getCombinationHistory(): Array<{elements: string[], result: string | null, timestamp: number}> {
    return [...this.gameStateSubject.value.combinationHistory];
  }

  getUnlockedAchievements(): Achievement[] {
    return this.gameStateSubject.value.achievements.filter(a => a.unlocked);
  }

  getAllAchievements(): Achievement[] {
    return [...this.gameStateSubject.value.achievements];
  }

  private saveGameState(): void {
    try {
      const state = this.gameStateSubject.value;
      const serializable = {
        discoveredElements: Array.from(state.discoveredElements),
        stats: state.stats,
        achievements: state.achievements,
        combinationHistory: state.combinationHistory
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serializable));
    } catch (error) {
      console.warn('Could not save game state:', error);
    }
  }

  private loadGameState(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const state: GameState = {
          discoveredElements: new Set(parsed.discoveredElements || ['fuego', 'agua', 'aire', 'tierra']),
          stats: { ...this.getInitialState().stats, ...parsed.stats },
          achievements: this.mergeAchievements(parsed.achievements || []),
          combinationHistory: parsed.combinationHistory || []
        };
        this.gameStateSubject.next(state);
      }
    } catch (error) {
      console.warn('Could not load game state:', error);
    }
  }

  private mergeAchievements(savedAchievements: Achievement[]): Achievement[] {
    const merged = [...this.achievements];
    const savedMap = new Map(savedAchievements.map(a => [a.id, a]));
    
    for (const achievement of merged) {
      const saved = savedMap.get(achievement.id);
      if (saved) {
        achievement.unlocked = saved.unlocked;
      }
    }
    
    return merged;
  }

  resetGame(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.gameStateSubject.next(this.getInitialState());
  }

  exportGameState(): string {
    return JSON.stringify({
      discoveredElements: Array.from(this.gameStateSubject.value.discoveredElements),
      stats: this.gameStateSubject.value.stats,
      achievements: this.gameStateSubject.value.achievements,
      combinationHistory: this.gameStateSubject.value.combinationHistory,
      exportDate: new Date().toISOString()
    }, null, 2);
  }

  importGameState(gameStateJson: string): boolean {
    try {
      const parsed = JSON.parse(gameStateJson);
      const state: GameState = {
        discoveredElements: new Set(parsed.discoveredElements),
        stats: parsed.stats,
        achievements: this.mergeAchievements(parsed.achievements),
        combinationHistory: parsed.combinationHistory || []
      };
      this.gameStateSubject.next(state);
      this.saveGameState();
      return true;
    } catch (error) {
      console.error('Could not import game state:', error);
      return false;
    }
  }
}