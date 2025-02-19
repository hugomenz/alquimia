import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ElementData {
  type: string;
  displayName: string;
  color: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class ElementsService {
  private elementsUrl = 'assets/data/elements.json';

  constructor(private http: HttpClient) {}

  getElements(): Observable<ElementData[]> {
    return this.http.get<ElementData[]>(this.elementsUrl);
  }
}
