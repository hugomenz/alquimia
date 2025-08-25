import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface InventoryItem {
  type: string;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly INVENTORY_SIZE = 12; // Increased inventory size

  private initialInventory: InventoryItem[] = [
    { type: 'fuego', quantity: 5 },
    { type: 'agua', quantity: 5 },
    { type: 'aire', quantity: 5 },
    { type: 'tierra', quantity: 5 },
    ...Array(this.INVENTORY_SIZE - 4).fill({ type: 'empty', quantity: 0 })
  ];

  private inventorySubject = new BehaviorSubject<InventoryItem[]>(
    this.initialInventory
  );
  inventory$ = this.inventorySubject.asObservable();

  addItem(type: string, quantity: number = 1): boolean {
    const inv = this.inventorySubject.getValue();
    
    // First try to add to existing stack
    const existingIndex = inv.findIndex((i) => i.type === type);
    if (existingIndex !== -1) {
      inv[existingIndex].quantity += quantity;
      this.inventorySubject.next([...inv]);
      return true;
    }

    // If not found, try to add to empty slot
    const emptyIndex = inv.findIndex((i) => i.type === 'empty');
    if (emptyIndex !== -1) {
      inv[emptyIndex] = { type, quantity };
      this.inventorySubject.next([...inv]);
      return true;
    }

    // No space available
    console.warn('No hay espacio en el inventario');
    return false;
  }

  removeItem(type: string, quantity: number = 1): boolean {
    const inv = this.inventorySubject.getValue();
    const index = inv.findIndex((i) => i.type === type && i.quantity >= quantity);
    
    if (index !== -1) {
      inv[index].quantity -= quantity;
      if (inv[index].quantity === 0) {
        inv[index].type = 'empty';
      }
      this.inventorySubject.next([...inv]);
      return true;
    }
    return false;
  }

  hasItem(type: string, quantity: number = 1): boolean {
    const inv = this.inventorySubject.getValue();
    const item = inv.find((i) => i.type === type);
    return item ? item.quantity >= quantity : false;
  }

  getItemCount(type: string): number {
    const inv = this.inventorySubject.getValue();
    const item = inv.find((i) => i.type === type);
    return item ? item.quantity : 0;
  }

  clearInventory(): void {
    this.inventorySubject.next([...this.initialInventory]);
  }

  getInventory(): InventoryItem[] {
    return [...this.inventorySubject.getValue()];
  }

  organizeInventory(): void {
    const inv = this.inventorySubject.getValue();
    const nonEmpty = inv.filter(item => item.type !== 'empty').sort((a, b) => a.type.localeCompare(b.type));
    const empty = Array(this.INVENTORY_SIZE - nonEmpty.length).fill({ type: 'empty', quantity: 0 });
    this.inventorySubject.next([...nonEmpty, ...empty]);
  }
}
