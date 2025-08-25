import { Component, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainStageComponent } from './components/main-stage/main-stage.component';
import { InventoryComponent } from './components/inventory/inventory.component';
import { AchievementsPanelComponent } from './components/achievements-panel/achievements-panel.component';
import { PlayerPortfolioComponent } from './components/player-portfolio/player-portfolio.component';
import { InventoryService } from './services/inventory.service';
import { GameStateService } from './services/game-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MainStageComponent, InventoryComponent, AchievementsPanelComponent, PlayerPortfolioComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  @ViewChild('mainStage') mainStageComponent?: MainStageComponent;

  constructor(
    private invService: InventoryService,
    private gameState: GameStateService
  ) {}

  onElementSelected(type: string) {
    const placed = this.mainStageComponent?.placeElement(type);
    if (placed) {
      this.invService.removeItem(type);
    }
  }
}
