import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ElementData {
  type: string;
  displayName: string;
  color: string;
  description: string;
  category: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  discovered: boolean;
  temperature: number;
  state: string;
  properties: string[];
}

export interface ElementCategory {
  name: string;
  displayName: string;
  description: string;
  color: string;
}

@Injectable({ providedIn: 'root' })
export class ElementsService {
  private elementsUrl = 'assets/data/elements.json';

  constructor(private http: HttpClient) {}

  getElements(): Observable<ElementData[]> {
    return this.http.get<ElementData[]>(this.elementsUrl);
  }

  getCategories(): ElementCategory[] {
    return [
      {
        name: 'elementos_primarios',
        displayName: 'Elementos Primarios',
        description: 'Los cuatro elementos fundamentales',
        color: '#ff6b6b'
      },
      {
        name: 'elementos_secundarios',
        displayName: 'Elementos Secundarios',
        description: 'Combinaciones básicas de elementos primarios',
        color: '#4ecdc4'
      },
      {
        name: 'materiales',
        displayName: 'Materiales',
        description: 'Sustancias físicas y materiales',
        color: '#45b7d1'
      },
      {
        name: 'vida',
        displayName: 'Vida',
        description: 'Seres vivos y organismos',
        color: '#96ceb4'
      },
      {
        name: 'organico',
        displayName: 'Orgánico',
        description: 'Materia orgánica y biológica',
        color: '#feca57'
      },
      {
        name: 'quimico',
        displayName: 'Químico',
        description: 'Sustancias y compuestos químicos',
        color: '#ff9ff3'
      },
      {
        name: 'abstracto',
        displayName: 'Abstracto',
        description: 'Conceptos y ideas abstractas',
        color: '#a29bfe'
      },
      {
        name: 'energia',
        displayName: 'Energía',
        description: 'Formas de energía y fuerzas',
        color: '#fd79a8'
      },
      {
        name: 'artificial',
        displayName: 'Artificial',
        description: 'Creaciones humanas y artificiales',
        color: '#fdcb6e'
      },
      {
        name: 'conocimiento',
        displayName: 'Conocimiento',
        description: 'Información y sabiduría',
        color: '#6c5ce7'
      },
      {
        name: 'emociones',
        displayName: 'Emociones',
        description: 'Sentimientos y estados emocionales',
        color: '#e17055'
      },
      {
        name: 'clima',
        displayName: 'Clima',
        description: 'Fenómenos meteorológicos',
        color: '#74b9ff'
      },
      {
        name: 'celestial',
        displayName: 'Celestial',
        description: 'Cuerpos y fenómenos celestiales',
        color: '#0984e3'
      }
    ];
  }

  getRarityColor(rarity: string): string {
    const colors = {
      'common': '#95a5a6',
      'uncommon': '#27ae60',
      'rare': '#3498db',
      'epic': '#9b59b6',
      'legendary': '#f39c12'
    };
    return colors[rarity as keyof typeof colors] || '#95a5a6';
  }

  getRarityName(rarity: string): string {
    const names = {
      'common': 'Común',
      'uncommon': 'Poco Común',
      'rare': 'Raro',
      'epic': 'Épico',
      'legendary': 'Legendario'
    };
    return names[rarity as keyof typeof names] || 'Común';
  }
}
