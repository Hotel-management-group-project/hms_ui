// Student ID: S2401885
// Student Name: Aiman Ahmed
// Module: Advanced Software Development (UFCF8S-30-2)
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar';
import { FooterComponent } from '../../shared/components/footer/footer';

@Component({
  selector: 'app-home',
  imports: [RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './home.html',
})
export class HomeComponent {
  features = [
    { icon: '★', title: 'Luxury Rooms', desc: 'From standard doubles to penthouse suites — every room curated for comfort.' },
    { icon: '⚡', title: 'Instant Booking', desc: 'Search, select, and confirm your stay in minutes with our seamless platform.' },
    { icon: '✦', title: 'Premium Service', desc: 'Airport transfers, spa access, and personalised ancillary services.' },
  ];
}
