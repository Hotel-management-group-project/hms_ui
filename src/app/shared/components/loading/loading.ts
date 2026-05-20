// Student ID: S2401276, S2401885, S2401709
// Student Names: Mohamed Iyaadh Ahmed, Aiman Ahmed, Ahmed Arkaan Afrah
// Module: Advanced Software Development (UFCF8S-30-2)
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.html',
})
export class LoadingComponent {
  message = input('Loading...');
  fullscreen = input(false);
}
