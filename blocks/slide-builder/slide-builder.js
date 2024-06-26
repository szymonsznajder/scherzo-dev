/* eslint-disable import/no-absolute-path */
/* eslint-disable import/no-unresolved */
/* eslint-disable function-paren-newline */
/* eslint-disable import/extensions */
/* eslint-disable no-alert */

import { createOptimizedPicture } from '../../scripts/aem.js';
import {
  a, div, li, p, h3, span, ul, img
} from '/plusplus/block-party/dom-helpers.js';
import ffetch from '/plusplus/block-party/ffetch.js';

export default async function decorate(block) {
// Select the element by its class
  const element = document.querySelector('.slide-builder-container');

  const content = await ffetch('/query-index.json').all();

  let targetNames = ['slides']; // Initialize targetNames with 'blog' as the default

  // Sort the filtered content by 'lastModified' in descending order
  const sortedContent = content.sort((adate, b) => {
    const dateA = new Date(adate.lastModified);
    const dateB = new Date(b.lastModified);
    return dateB - dateA;
  });

  // Append sorted and filtered content to the block, obeying limits
  block.append(
    ul(
      ...sortedContent.map((slide) => li(
        div({ class: 'slide-image' },
          createOptimizedPicture(slide.image, slide.headline, false, [{ width: '750' }]),
        ),
        div({ class: 'slides-body' },
          h3((slide.headline)),
          p(slide.description),
        ),
      )),
    ),
  );
}
