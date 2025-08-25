import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  InventoryItem,
  InventoryService,
} from '../../services/inventory.service';
import { ElementsService, ElementData } from '../../services/elements.service';
import { GameStateService } from '../../services/game-state.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent implements OnInit {
  inventory: InventoryItem[] = [];
  allElements: ElementData[] = [];
  discoveredElements: Set<string> = new Set();
  searchTerm: string = '';
  selectedCategory: string = 'all';
  selectedRarity: string = 'all';
  showOnlyDiscovered: boolean = true;

  @Output() elementSelected = new EventEmitter<string>();

  categories = [
    { value: 'all', label: 'Todas las Categorías' },
    { value: 'elementos_primarios', label: 'Elementos Primarios' },
    { value: 'elementos_secundarios', label: 'Elementos Secundarios' },
    { value: 'materiales', label: 'Materiales' },
    { value: 'vida', label: 'Vida' },
    { value: 'organico', label: 'Orgánico' },
    { value: 'quimico', label: 'Químico' },
    { value: 'abstracto', label: 'Abstracto' },
    { value: 'energia', label: 'Energía' },
    { value: 'artificial', label: 'Artificial' },
    { value: 'conocimiento', label: 'Conocimiento' },
    { value: 'emociones', label: 'Emociones' },
    { value: 'clima', label: 'Clima' },
    { value: 'celestial', label: 'Celestial' }
  ];

  rarities = [
    { value: 'all', label: 'Todas las Rarezas' },
    { value: 'common', label: 'Común' },
    { value: 'uncommon', label: 'Poco Común' },
    { value: 'rare', label: 'Raro' },
    { value: 'epic', label: 'Épico' },
    { value: 'legendary', label: 'Legendario' }
  ];

  constructor(
    private invService: InventoryService,
    private elementsService: ElementsService,
    private gameState: GameStateService
  ) {}

  ngOnInit() {
    this.invService.inventory$.subscribe((inv) => {
      this.inventory = inv;
    });

    this.elementsService.getElements().subscribe((elements) => {
      this.allElements = elements;
    });

    this.gameState.gameState$.subscribe((state) => {
      this.discoveredElements = state.discoveredElements;
    });
  }

  selectItem(item: InventoryItem) {
    if (item.type === 'empty' || item.quantity === 0) return;
    this.elementSelected.emit(item.type);
  }

  getElementData(type: string): ElementData | null {
    return this.allElements.find(el => el.type === type) || null;
  }

  getFilteredElements(): ElementData[] {
    return this.allElements.filter(element => {
      // Search filter
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        if (!element.displayName.toLowerCase().includes(searchLower) &&
            !element.description.toLowerCase().includes(searchLower) &&
            !element.type.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Category filter
      if (this.selectedCategory !== 'all' && element.category !== this.selectedCategory) {
        return false;
      }

      // Rarity filter
      if (this.selectedRarity !== 'all' && element.rarity !== this.selectedRarity) {
        return false;
      }

      // Discovery filter
      if (this.showOnlyDiscovered && !this.discoveredElements.has(element.type)) {
        return false;
      }

      return true;
    });
  }

  getElementQuantity(type: string): number {
    const item = this.inventory.find(i => i.type === type);
    return item ? item.quantity : 0;
  }

  isElementDiscovered(type: string): boolean {
    return this.discoveredElements.has(type);
  }

  getItemClass(element: ElementData): string {
    const isDiscovered = this.isElementDiscovered(element.type);
    const hasQuantity = this.getElementQuantity(element.type) > 0;
    
    return `element-item ${element.category} ${element.rarity} ${
      isDiscovered ? 'discovered' : 'undiscovered'
    } ${hasQuantity ? 'available' : 'unavailable'}`;
  }

  getItemStyle(element: ElementData): any {
    if (!this.isElementDiscovered(element.type)) {
      return {
        'background-color': '#444',
        'border-color': '#666',
        'color': '#888'
      };
    }

    return {
      'background-color': element.color + '20',
      'border-color': element.color,
      'color': element.color
    };
  }

  organizeInventory(): void {
    this.invService.organizeInventory();
  }

  getDiscoveryStats(): { discovered: number, total: number, percentage: number } {
    const discovered = this.discoveredElements.size;
    const total = this.allElements.length;
    const percentage = total > 0 ? Math.round((discovered / total) * 100) : 0;
    
    return { discovered, total, percentage };
  }

  getRarityStats(): { [key: string]: number } {
    const stats: { [key: string]: number } = {};
    
    for (const element of this.allElements) {
      if (this.isElementDiscovered(element.type)) {
        stats[element.rarity] = (stats[element.rarity] || 0) + 1;
      }
    }
    
    return stats;
  }
}
