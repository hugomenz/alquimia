import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService, Achievement } from '../../services/game-state.service';

@Component({
  selector: 'app-achievements-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './achievements-panel.component.html',
  styleUrl: './achievements-panel.component.scss'
})
export class AchievementsPanelComponent implements OnInit {
  achievements: Achievement[] = [];
  showUnlockedOnly: boolean = false;

  constructor(private gameState: GameStateService) {}

  ngOnInit() {
    this.gameState.gameState$.subscribe(state => {
      this.achievements = state.achievements;
    });
  }

  getFilteredAchievements(): Achievement[] {
    if (this.showUnlockedOnly) {
      return this.achievements.filter(a => a.unlocked);
    }
    return this.achievements;
  }

  getUnlockedCount(): number {
    return this.achievements.filter(a => a.unlocked).length;
  }

  getTotalCount(): number {
    return this.achievements.length;
  }

  getUnlockedPercentage(): number {
    const total = this.getTotalCount();
    if (total === 0) return 0;
    return Math.round((this.getUnlockedCount() / total) * 100);
  }

  toggleFilter(): void {
    this.showUnlockedOnly = !this.showUnlockedOnly;
  }
}
