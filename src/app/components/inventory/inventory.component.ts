import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import {
  InventoryItem,
  InventoryService,
} from '../../services/inventory.service';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [NgFor],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent implements OnInit {
  inventory: InventoryItem[] = [];
  @Output() elementSelected = new EventEmitter<string>();

  constructor(private invService: InventoryService) {}

  ngOnInit() {
    this.invService.inventory$.subscribe((inv) => {
      this.inventory = inv;
    });
  }

  selectItem(item: InventoryItem) {
    if (item.type === 'empty' || item.quantity === 0) return;
    // Emitir el elemento seleccionado
    this.elementSelected.emit(item.type);
  }
}
