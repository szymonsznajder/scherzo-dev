export default function decorate(block) {
  const heroChild = block.firstElementChild;
  heroChild.classList.add('heroChild');
  // const elements = block.querySelectorAll('p');
  const imageWrapper = document.createElement('div');
  imageWrapper.classList.add('image');
  // const title = document.createElement('h1');
  // title.innerHTML = elements[1].innerHTML;
  // elements[1].parentNode.replaceChild(title, elements[1]);

  const image = heroChild.querySelector('img');
  let lastScrollTop = 0;
  let scale = 1;

  function scrollHero() {
    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollTop > lastScrollTop && scale < 1.5) {
        // Scrolling down
        scale = Math.min(scale + 0.01, 1.5); // Increase the scale value within the range with two decimal numbers
      } else {
        // Scrolling up
        scale = Math.max(scale - 0.01, 1); // Decrease the scale value within the range with two decimal numbers
      }

      image.style.transform = `scale(${scale.toFixed(2)})`;
      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For Mobile or negative scrolling
    });
  }

  if (image && heroChild) {
    scrollHero();
  }
}
