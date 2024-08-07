/* eslint-disable no-unused-vars */
/* eslint-disable prefer-destructuring */
/* eslint-disable import/no-unresolved */
/* eslint-disable import/no-absolute-path */
import { renderExpressions } from '/plusplus/plugins/expressions/src/expressions.js';

// eslint-disable-next-line no-unused-vars
export default async function decorate(block) {
  async function fetchSlides() {
    try {
      console.log('Fetching slides from /slides/query-index.json');
      const response = await fetch('/slides/query-index.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const jsonFeed = await response.json();
      console.log('Fetched JSON feed:', jsonFeed);

      if (!jsonFeed.data || !Array.isArray(jsonFeed.data)) {
        throw new Error('Invalid data format in JSON feed');
      }

      console.log(`Processing ${jsonFeed.data.length} items from JSON feed`);

      const processedSlides = await Promise.all(jsonFeed.data.map(async (item, index) => {
        console.log(`Processing item ${index + 1}:`, item);

        if (!item.path || !item.path.startsWith('/slides/')) {
          console.log(`Skipping item ${index + 1}: Invalid path`);
          return null;
        }

        try {
          console.log(`Fetching HTML for ${item.path}.plain.html`);
          const htmlResponse = await fetch(`${item.path}.plain.html`);
          if (!htmlResponse.ok) {
            throw new Error(`Failed to fetch HTML for slide: ${item.path}`);
          }
          const html = await htmlResponse.text();

          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');

          const textElements = doc.querySelectorAll('.tytul-zdjecia > div > div');
          const titleParts = Array.from(textElements)
            .map((el) => el.textContent.trim())
            .filter((text) => text);

          console.log(`Title parts for item ${index + 1}:`, titleParts);

          const imgElement = doc.querySelector('picture source[media="(min-width: 600px)"]');
          let imageSrc = '';
          if (imgElement) {
            imageSrc = imgElement.getAttribute('srcset');
            imageSrc = imageSrc.split('?')[0];
          }
          const absoluteImageSrc = imageSrc ? new URL(imageSrc, window.location.origin).href : '';

          console.log(`Image source for item ${index + 1}:`, absoluteImageSrc);

          return {
            ...item,
            titleParts,
            image: absoluteImageSrc,
            description: '',
          };
        } catch (error) {
          console.error(`Error processing slide ${item.path}:`, error);
          return null;
        }
      }));

      const filteredSlides = processedSlides.filter((slide) => slide !== null);
      console.log(`Processed ${filteredSlides.length} valid slides`);
      console.log('Processed slides:', filteredSlides);
      return filteredSlides;
    } catch (error) {
      console.error('Error fetching or processing slides:', error);
      return [];
    }
  }

  function createSlideItem(slideData) {
    const { image, titleParts } = slideData;

    const slideItem = document.createElement('div');
    slideItem.classList.add('slide-builder-item');
    slideItem.setAttribute('data-bg', image);

    const titleHtml = titleParts.map((part, i) => `<div class="title-part title-part-${i + 1}">${part}</div>`).join('');

    slideItem.innerHTML = `
      <div class="slide-background"></div>
      <div class="text-container">
        ${titleHtml}
      </div>
    `;

    return slideItem;
  }

  function setSlideBackground(slideItem, imageUrl) {
    const backgroundElement = slideItem.querySelector('.slide-background');
    backgroundElement.style.backgroundImage = `url(${imageUrl})`;
    slideItem.classList.add('loaded');
  }

  const container = document.querySelector('.slide-builder');
  if (!container) {
    console.error('Slide builder container not found');
    return;
  }

  console.log('Fetching slides...');
  const slides = await fetchSlides();
  console.log('Fetched slides:', slides);

  if (!slides || slides.length === 0) {
    console.error('No valid slides found');
    return;
  }

  let currentScrollPosition = 0;
  const slideHeight = window.innerHeight;

  slides.forEach((slide, index) => {
    const slideItem = createSlideItem(slide);
    container.appendChild(slideItem);
    setSlideBackground(slideItem, slide.image);
  });

  function updateSlidePositions() {
    const slideItems = container.querySelectorAll('.slide-builder-item');
    slideItems.forEach((slideItem, index) => {
      const offset = (index * slideHeight) - currentScrollPosition;
      const progress = offset / slideHeight;

      // Keep the original translation calculation
      const translateY = Math.max(0, Math.min(100, progress * 100));

      slideItem.style.transform = `translateY(${translateY}%)`;
      // Correct the z-index calculation
      slideItem.style.zIndex = index;
    });
  }

  function handleScroll() {
    currentScrollPosition = window.scrollY;
    window.requestAnimationFrame(updateSlidePositions);
  }

  window.addEventListener('scroll', handleScroll);

  // Set initial positions
  updateSlidePositions();

  // Set the height of the body to accommodate all slides
  document.body.style.height = `${slides.length * 100}vh`;

  renderExpressions(document.querySelector('.slide-builder'));
}
