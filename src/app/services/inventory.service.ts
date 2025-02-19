import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface InventoryItem {
  type: string;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private initialInventory: InventoryItem[] = [
    { type: 'fuego', quantity: 3 },
    { type: 'agua', quantity: 2 },
    { type: 'aire', quantity: 1 },
    { type: 'empty', quantity: 0 },
    { type: 'empty', quantity: 0 },
    { type: 'empty', quantity: 0 },
    { type: 'empty', quantity: 0 },
  ];

  private inventorySubject = new BehaviorSubject<InventoryItem[]>(
    this.initialInventory
  );
  inventory$ = this.inventorySubject.asObservable();

  addItem(type: string): void {
    const inv = this.inventorySubject.getValue();
    const emptyIndex = inv.findIndex((i) => i.type === 'empty');
    if (emptyIndex !== -1) {
      inv[emptyIndex] = { type, quantity: 1 };
      this.inventorySubject.next([...inv]);
    } else {
      // No hay espacio
      console.warn('No hay espacio en el inventario');
    }
  }

  removeItem(type: string): boolean {
    const inv = this.inventorySubject.getValue();
    const index = inv.findIndex((i) => i.type === type && i.quantity > 0);
    if (index !== -1) {
      inv[index].quantity--;
      if (inv[index].quantity === 0) {
        inv[index].type = 'empty';
      }
      this.inventorySubject.next([...inv]);
      return true;
    }
    return false;
  }
}
