// Student ID: S2401885
// Student Name: Aiman Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-welcome',
  imports: [],
  templateUrl: './welcome.html',
})
export class WelcomeComponent {
  constructor(private router: Router) {}

  enter() {
    this.router.navigate(['/home']);
  }
}
