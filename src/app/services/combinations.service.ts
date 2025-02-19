import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Combination {
  inputs: string[];
  result: string;
}

@Injectable({ providedIn: 'root' })
export class CombinationsService {
  private combinationsUrl = 'assets/data/combinations.json';

  constructor(private http: HttpClient) {}

  getCombinations(): Observable<Combination[]> {
    return this.http.get<Combination[]>(this.combinationsUrl);
  }
}
