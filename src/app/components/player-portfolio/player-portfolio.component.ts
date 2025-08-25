import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EconomyService, PlayerEconomics, ElementValue } from '../../services/economy.service';
import { GameStateService } from '../../services/game-state.service';
import { ElementsService, ElementData } from '../../services/elements.service';
import { combineLatest, map } from 'rxjs';

@Component({
  selector: 'app-player-portfolio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-portfolio.component.html',
  styleUrl: './player-portfolio.component.scss'
})
export class PlayerPortfolioComponent implements OnInit {
  playerEconomics: PlayerEconomics | null = null;
  discoveredElements: Array<ElementValue & ElementData> = [];
  firstDiscoveries: Array<ElementValue & ElementData> = [];
  energyPercentage: number = 0;
  leaderboard: Array<{ elementType: string; value: number; discoverer: string; timestamp: number }> = [];

  constructor(
    private economyService: EconomyService,
    private gameState: GameStateService,
    private elementsService: ElementsService
  ) {}

  ngOnInit() {
    // Subscribe to player economics
    this.economyService.playerEconomics$.subscribe(economics => {
      this.playerEconomics = economics;
      this.energyPercentage = (economics.currentEnergy / economics.maxEnergy) * 100;
    });

    // Subscribe to discovered elements and enrich with economy data
    combineLatest([
      this.gameState.gameState$,
      this.elementsService.getElements()
    ]).pipe(
      map(([gameState, allElements]) => {
        const discovered = Array.from(gameState.discoveredElements);
        const elementMap = new Map(allElements.map(e => [e.type, e]));
        
        return discovered
          .map(elementType => {
            const elementData = elementMap.get(elementType);
            const elementValue = this.economyService.getElementValue(elementType);
            return elementData ? { ...elementData, ...elementValue } : null;
          })
          .filter(Boolean) as Array<ElementValue & ElementData>;
      })
    ).subscribe(elements => {
      this.discoveredElements = elements.sort((a, b) => b.currentValue - a.currentValue);
      this.firstDiscoveries = elements.filter(e => e.isFirstDiscoverer);
    });

    // Get leaderboard
    this.leaderboard = this.economyService.getLeaderboard().slice(0, 10);
  }

  buyEnergyBoost(): void {
    this.economyService.purchaseEnergyBoost(50);
  }

  activatePremium(): void {
    this.economyService.activatePremium();
  }

  formatValue(value: number): string {
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  }

  getRarityColor(rarity: string): string {
    const colors: Record<string, string> = {
      'common': '#95a5a6',
      'uncommon': '#3498db',
      'rare': '#9b59b6',
      'epic': '#f39c12',
      'legendary': '#e74c3c'
    };
    return colors[rarity] || '#95a5a6';
  }

  getEnergyStatusColor(): string {
    if (this.energyPercentage > 66) return '#2ecc71';
    if (this.energyPercentage > 33) return '#f39c12';
    return '#e74c3c';
  }

  canPerformCombination(): boolean {
    return this.economyService.canPerformCombination();
  }

  formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }
}
