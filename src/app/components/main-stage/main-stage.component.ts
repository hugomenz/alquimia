import { Component, OnInit } from '@angular/core';
import { InventoryService } from '../../services/inventory.service';
import { CombinationsService } from '../../services/combinations.service';

@Component({
  selector: 'app-main-stage',
  standalone: true,
  imports: [],
  templateUrl: './main-stage.component.html',
  styleUrl: './main-stage.component.scss',
})
export class MainStageComponent implements OnInit {
  slot1: string | null = null;
  slot2: string | null = null;
  combinations: { inputs: string[]; result: string }[] = [];

  constructor(
    private invService: InventoryService,
    private combService: CombinationsService
  ) {}

  ngOnInit() {
    this.combService.getCombinations().subscribe((data) => {
      this.combinations = data;
    });
  }

  placeElement(type: string): boolean {
    // Intenta colocar el elemento si hay lugar
    if (!this.slot1) {
      this.slot1 = type;
      return true;
    } else if (!this.slot2) {
      this.slot2 = type;
      return true;
    }
    return false;
  }

  fuse() {
    if (this.slot1 && this.slot2) {
      const combo = this.combinations.find(
        (c) =>
          (c.inputs[0] === this.slot1 && c.inputs[1] === this.slot2) ||
          (c.inputs[0] === this.slot2 && c.inputs[1] === this.slot1)
      );
      if (combo) {
        this.invService.addItem(combo.result);
      } else {
        console.log('No se generó un nuevo elemento');
      }
      this.clearSlots();
    }
  }

  clearSlots() {
    this.slot1 = null;
    this.slot2 = null;
  }
}
