import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { InactivityService } from './core/services/inactivity.service';
import { ToastComponent } from './shared/components/toast/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private auth = inject(AuthService);
  private inactivity = inject(InactivityService);

  ngOnInit(): void {
    // If user has a valid session on app boot, start the inactivity timer
    if (this.auth.isAuthenticated()) {
      this.inactivity.start();
    }
  }
}
