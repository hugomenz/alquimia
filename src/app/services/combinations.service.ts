import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Combination {
  inputs: string[];
  result: string;
  difficulty?: number;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class CombinationsService {
  private combinationsUrl = 'assets/data/combinations.json';

  constructor(private http: HttpClient) {}

  getCombinations(): Observable<Combination[]> {
    return this.http.get<Combination[]>(this.combinationsUrl);
  }

  findCombination(elements: string[], combinations: Combination[]): Combination | null {
    return combinations.find(combo => {
      if (combo.inputs.length !== elements.length) return false;
      
      // Check all permutations for multi-element combinations
      return this.hasAllElements(combo.inputs, elements);
    }) || null;
  }

  private hasAllElements(required: string[], provided: string[]): boolean {
    const requiredCopy = [...required];
    const providedCopy = [...provided];
    
    for (const req of requiredCopy) {
      const index = providedCopy.indexOf(req);
      if (index === -1) return false;
      providedCopy.splice(index, 1);
    }
    
    return providedCopy.length === 0;
  }

  getHint(elements: string[], combinations: Combination[]): string | null {
    // Find combinations that partially match current elements
    const partialMatches = combinations.filter(combo => 
      elements.some(el => combo.inputs.includes(el)) && 
      !this.findCombination(elements, combinations)
    );

    if (partialMatches.length > 0) {
      const combo = partialMatches[0];
      const missing = combo.inputs.filter(input => !elements.includes(input));
      if (missing.length === 1) {
        return `Intenta agregar: ${missing[0]}`;
      } else if (missing.length > 1) {
        return `Te faltan ${missing.length} elementos para una combinación`;
      }
    }

    return null;
  }
}
