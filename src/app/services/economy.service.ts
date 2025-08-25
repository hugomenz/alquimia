import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { GameStateService } from './game-state.service';
import { ElementsService, ElementData } from './elements.service';
import { CombinationsService } from './combinations.service';

export interface ElementValue {
  type: string;
  baseValue: number;
  currentValue: number;
  rarity: string;
  difficulty: number;
  firstDiscovererBonus: number;
  discoveryTimestamp?: number;
  isFirstDiscoverer: boolean;
}

export interface PlayerEconomics {
  totalPortfolioValue: number;
  totalElementsDiscovered: number;
  firstDiscoveries: number;
  efficiencyBonus: number;
  achievementMultiplier: number;
  currentEnergy: number;
  maxEnergy: number;
  energyRegenRate: number;
  premiumStatus: boolean;
}

export interface EconomyConfig {
  // Base values by rarity
  rarityMultipliers: Record<string, number>;
  // Difficulty multipliers
  difficultyMultipliers: Record<number, number>;
  // First discoverer bonus percentage
  firstDiscovererBonus: number;
  // Energy system
  maxEnergy: number;
  energyPerCombination: number;
  energyRegenTime: number; // minutes
  // Efficiency bonuses
  efficiencyThresholds: Array<{ threshold: number; multiplier: number }>;
}

@Injectable({ providedIn: 'root' })
export class EconomyService {
  private readonly STORAGE_KEY = 'alquimia_economy_state';
  
  private economyConfig: EconomyConfig = {
    rarityMultipliers: {
      'common': 1,
      'uncommon': 5,
      'rare': 25,
      'epic': 100,
      'legendary': 500
    },
    difficultyMultipliers: {
      1: 1,
      2: 2,
      3: 4,
      4: 8,
      5: 16,
      6: 32,
      7: 64,
      8: 128,
      9: 256
    },
    firstDiscovererBonus: 0.5, // 50% bonus for first discovery
    maxEnergy: 100,
    energyPerCombination: 10,
    energyRegenTime: 5, // 5 minutes per energy point
    efficiencyThresholds: [
      { threshold: 0.8, multiplier: 1.2 },
      { threshold: 0.9, multiplier: 1.5 },
      { threshold: 0.95, multiplier: 2.0 }
    ]
  };

  private playerEconomicsSubject = new BehaviorSubject<PlayerEconomics>({
    totalPortfolioValue: 0,
    totalElementsDiscovered: 0,
    firstDiscoveries: 0,
    efficiencyBonus: 1,
    achievementMultiplier: 1,
    currentEnergy: 100,
    maxEnergy: 100,
    energyRegenRate: 1,
    premiumStatus: false
  });

  private firstDiscoverers = new Map<string, { playerId: string; timestamp: number }>();
  private elementValues = new Map<string, ElementValue>();

  public playerEconomics$ = this.playerEconomicsSubject.asObservable();

  constructor(
    private gameState: GameStateService,
    private elementsService: ElementsService,
    private combinationsService: CombinationsService
  ) {
    this.initializeEconomy();
    this.startEnergyRegeneration();
    this.subscribeToGameChanges();
  }

  private initializeEconomy(): void {
    // Load saved state
    this.loadEconomyState();
    
    // Initialize element values
    combineLatest([
      this.elementsService.getElements(),
      this.combinationsService.getCombinations(),
      this.gameState.gameState$
    ]).subscribe(([elements, combinations, gameState]) => {
      this.initializeElementValues(elements, combinations);
      this.updatePlayerEconomics();
    });
  }

  private initializeElementValues(elements: ElementData[], combinations: any[]): void {
    elements.forEach(element => {
      const difficulty = this.getElementDifficulty(element.type, combinations);
      const baseValue = this.calculateBaseValue(element.rarity, difficulty);
      
      this.elementValues.set(element.type, {
        type: element.type,
        baseValue,
        currentValue: baseValue,
        rarity: element.rarity,
        difficulty,
        firstDiscovererBonus: 0,
        isFirstDiscoverer: false
      });
    });
  }

  private getElementDifficulty(elementType: string, combinations: any[]): number {
    // Basic elements have difficulty 1
    const basicElements = ['fuego', 'agua', 'aire', 'tierra'];
    if (basicElements.includes(elementType)) return 1;
    
    // Find combination that creates this element
    const combo = combinations.find(c => c.result === elementType);
    if (combo && combo.difficulty) {
      return combo.difficulty;
    }
    
    // Estimate difficulty based on rarity if no combination found
    return Math.floor(Math.random() * 6) + 1; // 1-6 for now
  }

  private calculateBaseValue(rarity: string, difficulty: number): number {
    const rarityMultiplier = this.economyConfig.rarityMultipliers[rarity] || 1;
    const difficultyMultiplier = this.economyConfig.difficultyMultipliers[difficulty] || 1;
    return Math.round(10 * rarityMultiplier * difficultyMultiplier);
  }

  private subscribeToGameChanges(): void {
    this.gameState.gameState$.subscribe(gameState => {
      this.updatePlayerEconomics();
    });
  }

  private updatePlayerEconomics(): void {
    const gameStats = this.gameState.getGameStats();
    
    // Get current game state
    this.gameState.gameState$.subscribe(gameState => {
      const discoveredElements = Array.from(gameState.discoveredElements);
      
      // Calculate total portfolio value
      let totalValue = 0;
      let firstDiscoveries = 0;
      
      discoveredElements.forEach((elementType: string) => {
        const elementValue = this.getElementValue(elementType);
        totalValue += elementValue.currentValue;
        if (elementValue.isFirstDiscoverer) {
          firstDiscoveries++;
        }
      });

      // Calculate efficiency bonus
      const efficiency = gameStats.combinationsAttempted > 0 
        ? gameStats.successfulCombinations / gameStats.combinationsAttempted 
        : 0;
      
      const efficiencyBonus = this.calculateEfficiencyBonus(efficiency);
      
      // Calculate achievement multiplier
      const achievementMultiplier = this.calculateAchievementMultiplier(gameStats.achievementsUnlocked.length);

      const currentEconomics = this.playerEconomicsSubject.value;
      
      this.playerEconomicsSubject.next({
        ...currentEconomics,
        totalPortfolioValue: Math.round(totalValue * efficiencyBonus * achievementMultiplier),
        totalElementsDiscovered: gameStats.elementsDiscovered,
        firstDiscoveries,
        efficiencyBonus,
        achievementMultiplier
      });
    }).unsubscribe(); // Unsubscribe immediately since we only need current value
  }

  private calculateEfficiencyBonus(efficiency: number): number {
    for (const threshold of this.economyConfig.efficiencyThresholds.reverse()) {
      if (efficiency >= threshold.threshold) {
        return threshold.multiplier;
      }
    }
    return 1;
  }

  private calculateAchievementMultiplier(achievementCount: number): number {
    return 1 + (achievementCount * 0.1); // 10% bonus per achievement
  }

  recordElementDiscovery(elementType: string, playerId: string = 'current_player'): void {
    if (!this.firstDiscoverers.has(elementType)) {
      // First discoverer!
      this.firstDiscoverers.set(elementType, {
        playerId,
        timestamp: Date.now()
      });

      const elementValue = this.elementValues.get(elementType);
      if (elementValue) {
        elementValue.isFirstDiscoverer = true;
        elementValue.firstDiscovererBonus = Math.round(
          elementValue.baseValue * this.economyConfig.firstDiscovererBonus
        );
        elementValue.currentValue = elementValue.baseValue + elementValue.firstDiscovererBonus;
        elementValue.discoveryTimestamp = Date.now();
        
        this.elementValues.set(elementType, elementValue);
      }
    }

    this.updatePlayerEconomics();
    this.saveEconomyState();
  }

  getElementValue(elementType: string): ElementValue {
    return this.elementValues.get(elementType) || {
      type: elementType,
      baseValue: 10,
      currentValue: 10,
      rarity: 'common',
      difficulty: 1,
      firstDiscovererBonus: 0,
      isFirstDiscoverer: false
    };
  }

  canPerformCombination(): boolean {
    const economics = this.playerEconomicsSubject.value;
    return economics.currentEnergy >= this.economyConfig.energyPerCombination || 
           economics.premiumStatus;
  }

  consumeEnergyForCombination(): boolean {
    const economics = this.playerEconomicsSubject.value;
    
    if (economics.premiumStatus) {
      return true; // Premium users have unlimited energy
    }

    if (economics.currentEnergy >= this.economyConfig.energyPerCombination) {
      this.playerEconomicsSubject.next({
        ...economics,
        currentEnergy: economics.currentEnergy - this.economyConfig.energyPerCombination
      });
      this.saveEconomyState();
      return true;
    }
    
    return false;
  }

  purchaseEnergyBoost(amount: number = 50): boolean {
    // In a real implementation, this would involve actual payment
    const economics = this.playerEconomicsSubject.value;
    const newEnergy = Math.min(
      economics.currentEnergy + amount,
      economics.maxEnergy
    );
    
    this.playerEconomicsSubject.next({
      ...economics,
      currentEnergy: newEnergy
    });
    
    this.saveEconomyState();
    return true;
  }

  activatePremium(): boolean {
    // In a real implementation, this would involve actual payment
    const economics = this.playerEconomicsSubject.value;
    this.playerEconomicsSubject.next({
      ...economics,
      premiumStatus: true,
      currentEnergy: economics.maxEnergy
    });
    
    this.saveEconomyState();
    return true;
  }

  private startEnergyRegeneration(): void {
    setInterval(() => {
      const economics = this.playerEconomicsSubject.value;
      if (economics.currentEnergy < economics.maxEnergy && !economics.premiumStatus) {
        this.playerEconomicsSubject.next({
          ...economics,
          currentEnergy: Math.min(economics.currentEnergy + 1, economics.maxEnergy)
        });
        this.saveEconomyState();
      }
    }, this.economyConfig.energyRegenTime * 60 * 1000); // Convert minutes to milliseconds
  }

  getFirstDiscoverers(): Map<string, { playerId: string; timestamp: number }> {
    return new Map(this.firstDiscoverers);
  }

  getLeaderboard(): Array<{ elementType: string; value: number; discoverer: string; timestamp: number }> {
    const leaderboard: Array<{ elementType: string; value: number; discoverer: string; timestamp: number }> = [];
    
    this.firstDiscoverers.forEach((discoveryInfo, elementType) => {
      const elementValue = this.elementValues.get(elementType);
      if (elementValue) {
        leaderboard.push({
          elementType,
          value: elementValue.currentValue,
          discoverer: discoveryInfo.playerId,
          timestamp: discoveryInfo.timestamp
        });
      }
    });

    return leaderboard.sort((a, b) => b.value - a.value);
  }

  private saveEconomyState(): void {
    try {
      const state = {
        playerEconomics: this.playerEconomicsSubject.value,
        firstDiscoverers: Array.from(this.firstDiscoverers.entries()),
        elementValues: Array.from(this.elementValues.entries())
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Could not save economy state:', error);
    }
  }

  private loadEconomyState(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        
        if (state.playerEconomics) {
          this.playerEconomicsSubject.next(state.playerEconomics);
        }
        
        if (state.firstDiscoverers) {
          this.firstDiscoverers = new Map(state.firstDiscoverers);
        }
        
        if (state.elementValues) {
          this.elementValues = new Map(state.elementValues);
        }
      }
    } catch (error) {
      console.warn('Could not load economy state:', error);
    }
  }

  resetEconomy(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.firstDiscoverers.clear();
    this.elementValues.clear();
    this.playerEconomicsSubject.next({
      totalPortfolioValue: 0,
      totalElementsDiscovered: 0,
      firstDiscoveries: 0,
      efficiencyBonus: 1,
      achievementMultiplier: 1,
      currentEnergy: 100,
      maxEnergy: 100,
      energyRegenRate: 1,
      premiumStatus: false
    });
  }
}