import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerPortfolioComponent } from './player-portfolio.component';

describe('PlayerPortfolioComponent', () => {
  let component: PlayerPortfolioComponent;
  let fixture: ComponentFixture<PlayerPortfolioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerPortfolioComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlayerPortfolioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
