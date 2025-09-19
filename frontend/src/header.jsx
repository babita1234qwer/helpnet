import './index.css';
import { useState } from "react";
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { logoutUser } from './authslice';
import { useLocation } from 'react-router-dom';

import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Button
} from "@heroui/react";

export const HelpNetLogo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    className="w-8 h-8 text-white"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 2l9 5-9 5-9-5 9-5zm0 10l9-5v10l-9 5-9-5V7l9 5z"
    />
  </svg>
);

export default function NavbarHelpNet() {
  const location = useLocation();
  const {isAuthenticated, user, loading} = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [solvedProblems, setSolvedProblems] = useState([]);
  
  const handleLogout = () => {
    dispatch(logoutUser());
    setSolvedProblems([]);
  };

  // Check if we're on the home page to show the hero section
  const isHomePage = location.pathname === '/';

  return (
    <>
      <Navbar className="w-full fixed top-0 left-0 z-50 bg-blue-600 px-6 py-3" maxWidth="none">
        
        {/* Logo + Requests */}
        <NavbarBrand className="flex items-center gap-4 flex-shrink-0">
          <HelpNetLogo />
          <span className="font-bold text-xl">HelpNet</span>
        </NavbarBrand>

        {/* Center Menu Items */}
        <NavbarContent className="flex gap-6 justify-evenly flex-grow">
          <Button
            as={Link}
            href="/emergency/create"
            color="secondary"
            variant="flat"
            className="font-medium"
          >
            Report
          </Button>
          
          <NavbarItem>
            <Link color="foreground" href="/volunteers" className="text-white font-medium text-lg hover:text-blue-200 transition-colors">
              Volunteers
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Dropdown placement="bottom">
              <DropdownTrigger>
                <Link color="foreground" href="#" className="text-white font-medium text-lg hover:text-blue-200 transition-colors">
                  Emergency Services
                </Link>
              </DropdownTrigger>
      
              <DropdownMenu
                variant="flat"
                aria-label="Emergency Services"
                className="flex-col bg-blue-600/90 backdrop-blur-md rounded-md shadow-sm"
              >
                <DropdownItem className="px-4 py-2 hover:bg-blue-500 text-white font-medium transition-colors rounded-md">
                  <Link href="/emergency/map" className="w-full h-full block text-white">
                    Emergency Map
                  </Link>
                </DropdownItem>
                <DropdownItem className="px-4 py-2 hover:bg-blue-500 text-white font-medium transition-colors rounded-md">
                  <Link href="/emergency/create" className="w-full h-full block text-white">
                    Report Emergency
                  </Link>
                </DropdownItem>
                <DropdownItem className="px-4 py-2 hover:bg-blue-500 text-white font-medium transition-colors rounded-md">
                  Natural Calamities
                </DropdownItem>
                <DropdownItem className="px-4 py-2 hover:bg-blue-500 text-white font-medium transition-colors rounded-md">
                  Donation
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarItem>
          <NavbarItem>
            <Link color="foreground" href="/about" className="text-white font-medium text-lg hover:text-blue-200 transition-colors">
              About
            </Link>
          </NavbarItem>
        </NavbarContent>

        {/* Right: Profile Dropdown */}
        <NavbarContent as="div" justify="end" className="flex-shrink-0">
          {isAuthenticated ? (
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Avatar
                  isBordered
                  as="button"
                  color="secondary"
                  name="HelpNet User"
                  size="sm"
                  src="https://i.pravatar.cc/150?u=user" 
                  className="w-12 h-12 rounded-full border border-gray-300"
                />
              </DropdownTrigger>
                
              <DropdownMenu aria-label="Profile Actions" variant="flat">
                <DropdownItem className="h-14 gap-2 flex-col">
                  <p className="font-semibold">Signed in as</p>
                  <p className="font-semibold">{user.email}</p>
                </DropdownItem>
                <DropdownItem>Dashboard</DropdownItem>
                <DropdownItem>Settings</DropdownItem>
                <DropdownItem>Help & Feedback</DropdownItem>
                <DropdownItem color="danger" onClick={handleLogout}>
                  Log Out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          ) : (
            <Button
              as={Link}
              href="/user/login"
              color="secondary"
              variant="flat"
              className="font-medium"
            >
              Login
            </Button>
          )}
        </NavbarContent>
      </Navbar>

      {isHomePage && (
        <section className="hero-section w-full bg-gray-900 text-white py-48 px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 continuous-fade continuous-fade-delay-1">
            Let's come together to help and support every community in need.
          </h1>
          <h2 className="text-4xl md:text-5xl font-bold leading-snug mb-4 continuous-fade continuous-fade-delay-2">
            Together, we can make a difference in the world!
          </h2>
          <h3 className="text-2xl md:text-3xl font-medium leading-snug continuous-fade-delay-3">
            Join hands and make an impact today. Connect, contribute, and change lives for the better.
          </h3>
        </section>
      )}

      <footer className="bg-blue-800 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8">

          {/* Logo + About */}
          <div className="flex flex-col gap-4 md:w-1/3">
            <div className="flex items-center gap-2">
              <HelpNetLogo className="w-8 h-8 text-yellow-300" />
              <span className="font-bold text-xl">HelpNet</span>
            </div>
            <p className="text-gray-200">
              Connecting volunteers and communities to make a difference together. Join us and help those in need!
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-2 md:w-1/3">
            <h3 className="font-semibold text-lg mb-2">Quick Links</h3>
            <a href="/requests" className="text-gray-200 hover:text-white transition-colors">Requests</a>
            <a href="/volunteers" className="text-gray-200 hover:text-white transition-colors">Volunteers</a>
            <a href="/about" className="text-gray-200 hover:text-white transition-colors">About</a>
            <a href="#" className="text-gray-200 hover:text-white transition-colors">Emergency Services</a>
          </div>

          {/* Social / Contact */}
          <div className="flex flex-col gap-4 md:w-1/3">
            <h3 className="font-semibold text-lg mb-2">Connect with us</h3>
            <div className="flex gap-4">
              {/* Facebook */}
              <a href="#" className="text-gray-200 hover:text-blue-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.23 0H1.77C.79 0 0 .78 0 1.75v20.5C0 23.22.79 24 1.77 24h20.46c.98 0 1.77-.78 1.77-1.75V1.75C24 .78 23.21 0 22.23 0zM7.12 20.45H3.56V9h3.56v11.45zM5.34 7.57a2.06 2.06 0 110-4.12 2.06 2.06 0 010 4.12zm15.11 12.88h-3.55v-5.58c0-1.33-.03-3.05-1.86-3.05-1.86 0-2.15 1.46-2.15 2.96v5.67h-3.55V9h3.41v1.56h.05c.48-.91 1.65-1.86 3.39-1.86 3.62 0 4.28 2.38 4.28 5.46v6.28z"/>
                </svg>
              </a>
              {/* Twitter */}
              <a href="#" className="text-gray-200 hover:text-blue-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.56a9.94 9.94 0 01-2.83.78 4.95 4.95 0 002.17-2.72 9.84 9.84 0 01-3.13 1.2 4.92 4.92 0 00-8.4 4.49A13.94 13.94 0 011.67 3.15a4.91 4.91 0 001.52 6.57 4.93 4.93 0 01-2.23-.61v.06a4.93 4.93 0 003.95 4.83 4.9 4.9 0 01-2.22.08 4.93 4.93 0 004.6 3.42 9.86 9.86 0 01-6.1 2.1c-.4 0-.79-.02-1.18-.07a13.92 13.92 0 007.56 2.22c9.06 0 14-7.5 14-14v-.64A9.98 9.98 0 0024 4.56z"/>
                </svg>
              </a>
              {/* Instagram */}
              <a href="#" className="text-gray-200 hover:text-pink-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.16c3.2 0 3.584.012 4.85.07 1.17.056 1.97.248 2.43.414a4.9 4.9 0 011.77 1.03 4.9 4.9 0 011.03 1.77c.166.46.358 1.26.414 2.43.058 1.27.07 1.65.07 4.85s-.012 3.584-.07 4.85c-.056 1.17-.248 1.97-.414 2.43a4.9 4.9 0 01-1.77-1.03 4.9 4.9 0 01-1.03-1.77c-.166-.46-.358-1.26-.414-2.43C2.172 15.584 2.16 15.2 2.16 12s.012-3.584.07-4.85c.056-1.17.248-1.97.414-2.43a4.9 4.9 0 011.03-1.77 4.9 4.9 0 011.77-1.03c.46-.166 1.26-.358 2.43-.414C8.416 2.172 8.8 2.16 12 2.16zM12 7.44a4.56 4.56 0 110 9.12 4.56 4.56 0 010-9.12zm0 1.84a2.72 2.72 0 100 5.44 2.72 2.72 0 000-5.44zm4.88-2.82a1.06 1.06 0 11-2.12 0 1.06 1.06 0 012.12 0z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-blue-700 pt-6 text-center text-gray-200 text-sm">
          © 2025 HelpNet. All rights reserved.
        </div>
      </footer>
    </>
  );
}