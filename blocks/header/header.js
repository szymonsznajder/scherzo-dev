/* eslint-disable no-use-before-define */

import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded) {
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else {
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

function toggleAllNavSections(sections, expanded = false) {
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = expanded ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');

  navSections.querySelectorAll('li').forEach((li) => {
    li.setAttribute('aria-expanded', 'false');
    const ul = li.querySelector('ul');
    if (ul) {
      ul.classList.add('close');
      ul.classList.remove('open');
    }
  });

  const navDrops = navSections.querySelectorAll('.nav-drop');
  navDrops.forEach((drop) => {
    if (!drop.hasAttribute('tabindex')) {
      drop.setAttribute('role', 'button');
      drop.setAttribute('tabindex', 0);
      drop.addEventListener('focus', focusNavSection);
    }
  });

  if (!expanded) {
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
  }

  if (expanded) {
    removeMovementClasses();
  }
}

function toggleLiAndUl(li) {
  const expanded = li.getAttribute('aria-expanded') === 'true';
  li.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  const ul = li.querySelector('ul');
  if (ul) {
    ul.classList.toggle('open');
    ul.classList.toggle('close');
  }
}

function handleMovementClasses(li) {
  const level = li.closest('.nav-sections > .default-content-wrapper > ul > li > ul') ? 2 : 1;
  const firstLevelUl = li.closest('.nav-sections > .default-content-wrapper > ul');
  const secondLevelUl = li.closest('ul');

  if (level === 1 && secondLevelUl) {
    firstLevelUl.classList.add('moved25');
    firstLevelUl.classList.remove('moved50');
  } else if (level === 2 && secondLevelUl) {
    firstLevelUl.classList.add('moved50');
    firstLevelUl.classList.remove('moved25');
    secondLevelUl.classList.add('moved25');
  }
}

function removeMovementClasses() {
  const firstLevelUl = document.querySelector('.nav-sections > .default-content-wrapper > ul');
  const secondLevelUls = document.querySelectorAll('.nav-sections > .default-content-wrapper > ul > li > ul');
  firstLevelUl.classList.remove('moved25', 'moved50');
  secondLevelUls.forEach((ul) => ul.classList.remove('moved25'));
}

function attachClickListeners(li) {
  li.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleLiAndUl(li);
    handleMovementClasses(li);
  });

  const nestedLis = li.querySelectorAll('ul > li');
  nestedLis.forEach((nestedLi) => attachClickListeners(nestedLi));
}

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
      attachClickListeners(navSection);
    });
  }

  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
