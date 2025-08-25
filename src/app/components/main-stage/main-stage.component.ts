import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../services/inventory.service';
import { CombinationsService, Combination } from '../../services/combinations.service';
import { ElementsService, ElementData } from '../../services/elements.service';
import { GameStateService } from '../../services/game-state.service';
import { EconomyService } from '../../services/economy.service';

@Component({
  selector: 'app-main-stage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './main-stage.component.html',
  styleUrl: './main-stage.component.scss',
})
export class MainStageComponent implements OnInit {
  slots: (string | null)[] = [null, null, null]; // Support up to 3 elements
  combinations: Combination[] = [];
  elements: ElementData[] = [];
  currentHint: string | null = null;
  lastResult: { element: string | null, success: boolean } | null = null;
  isAnimating: boolean = false;

  constructor(
    private invService: InventoryService,
    private combService: CombinationsService,
    private elementsService: ElementsService,
    private gameState: GameStateService,
    private economyService: EconomyService
  ) {}

  ngOnInit() {
    this.combService.getCombinations().subscribe((data) => {
      this.combinations = data;
    });

    this.elementsService.getElements().subscribe((elements) => {
      this.elements = elements;
      this.gameState.setTotalElements(elements.length);
    });
  }

  placeElement(type: string): boolean {
    // Find first empty slot
    const emptySlotIndex = this.slots.findIndex(slot => slot === null);
    if (emptySlotIndex !== -1) {
      this.slots[emptySlotIndex] = type;
      this.updateHint();
      return true;
    }
    return false;
  }

  removeElementFromSlot(index: number): void {
    if (this.slots[index]) {
      const elementType = this.slots[index]!;
      this.slots[index] = null;
      this.invService.addItem(elementType);
      this.updateHint();
    }
  }

  fuse(): void {
    const activeElements = this.slots.filter(slot => slot !== null) as string[];
    
    if (activeElements.length < 2) {
      this.showMessage('Necesitas al menos 2 elementos', false);
      return;
    }

    // Check energy before attempting fusion
    if (!this.economyService.canPerformCombination()) {
      this.showMessage('No tienes suficiente energía. Compra un boost o activa premium.', false);
      return;
    }

    // Consume energy
    if (!this.economyService.consumeEnergyForCombination()) {
      this.showMessage('Error al consumir energía', false);
      return;
    }

    this.isAnimating = true;
    this.gameState.recordCombination(activeElements, null); // Initial record

    setTimeout(() => {
      const combo = this.combService.findCombination(activeElements, this.combinations);
      
      if (combo) {
        // Success!
        this.gameState.recordCombination(activeElements, combo.result); // Update with success
        
        // Check if this is a new discovery for economy tracking
        const wasDiscovered = this.gameState.isElementDiscovered(combo.result);
        this.gameState.discoverElement(combo.result);
        
        // Record discovery in economy system if it's new
        if (!wasDiscovered) {
          this.economyService.recordElementDiscovery(combo.result);
        }
        
        this.invService.addItem(combo.result);
        this.showMessage(`¡Creaste ${this.getElementDisplayName(combo.result)}!`, true);
        
        // Show value earned if it's a first discovery
        if (!wasDiscovered) {
          const elementValue = this.economyService.getElementValue(combo.result);
          setTimeout(() => {
            this.showMessage(`🎉 ¡Primera descoberta! +${elementValue.currentValue} ALQ`, true);
          }, 2000);
        }
        
        if (combo.description) {
          setTimeout(() => {
            this.showMessage(combo.description!, true);
          }, 4000);
        }
      } else {
        this.showMessage('No se generó un nuevo elemento', false);
      }
      
      this.clearSlots();
      this.isAnimating = false;
    }, 1500); // Animation duration
  }

  clearSlots(): void {
    this.slots = [null, null, null];
    this.currentHint = null;
    this.updateHint();
  }

  private updateHint(): void {
    const activeElements = this.slots.filter(slot => slot !== null) as string[];
    if (activeElements.length > 0) {
      this.currentHint = this.combService.getHint(activeElements, this.combinations);
    } else {
      this.currentHint = null;
    }
  }

  private showMessage(message: string, success: boolean): void {
    this.lastResult = { element: message, success };
    setTimeout(() => {
      this.lastResult = null;
    }, 3000);
  }

  private getElementDisplayName(type: string): string {
    const element = this.elements.find(el => el.type === type);
    return element ? element.displayName : type;
  }

  getElementData(type: string): ElementData | null {
    return this.elements.find(el => el.type === type) || null;
  }

  canFuse(): boolean {
    const activeElements = this.slots.filter(slot => slot !== null);
    return activeElements.length >= 2 && !this.isAnimating && this.economyService.canPerformCombination();
  }

  getSlotClass(index: number): string {
    const slot = this.slots[index];
    if (!slot) return 'stage-slot empty';
    
    const element = this.getElementData(slot);
    if (!element) return 'stage-slot';
    
    return `stage-slot filled ${element.category} ${element.rarity}`;
  }

  getSlotStyle(index: number): any {
    const slot = this.slots[index];
    if (!slot) return {};
    
    const element = this.getElementData(slot);
    if (!element) return {};
    
    return {
      'background-color': element.color + '20',
      'border-color': element.color,
      'color': element.color
    };
  }
}
