import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.html',
})
export class LoadingComponent {
  message = input('Loading...');
  fullscreen = input(false);
}
