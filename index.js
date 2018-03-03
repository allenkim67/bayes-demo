/*
Split - Adjustable divided container
Pane - Non-adjustable divided container
*/

const last = require('lodash/last')
const range = require('lodash/range')
const zip = require('lodash/zip')
const zipWith = require('lodash/zipWith')
const sum = require('lodash/sum')
const Split = require('split.js')

let priorsSplit = createSplit('#priors', 'vertical')
let evidenceSplits = createSplits('#evidence')

setupEvents()

function createSplit(container, direction) {
  const ss = getSplitSelectors(container)
  const nSplits = ss.length
  const percentEls = $(container).find('.percent')
  const id = $(container).data('id')
  const $observed = $('#observed')
  const $posteriorPercents = $('#posterior').find('.percent')

  const split = Split(ss, {
    direction: direction,
    sizes: Array(nSplits).fill(round(100/nSplits)),
    minSize: 0,
    snapOffset: 1,
    gutterSize: 5,
    onDrag: () => {
      setPercents(container, split)
      const percents = percentEls.map((i, percent) => percent.innerHTML).get();
      if (direction === 'vertical') {
        setPaneHeights('#evidence', percents)
      }
      setObserved($observed, $posteriorPercents)
    }
  })

  setPercents(container, split)

  return split
}

function setPaneHeights(selector, percents) {
  percents = percents || $('#priors')
    .find('.percent')
    .map((i, el) => el.innerHTML)
    .get()

  $(selector).find('.pane').each(function(i, pane) {
    pane.style.height = typeof(percents[i]) === 'number' ? 
      percents[i] + '%' :
      percents[i]
  })
}

function setPaneWidths(selector, percents) {
  $(selector).find('.pane-v').each(function(i, pane) {
    pane.style.width = typeof(percents[i]) === 'number' ? 
      percents[i] + '%' :
      percents[i]
  })
}

function getSplitSelectors(container) {
  return $(container)
    .find('.split')
    .map((i, el) => `${container} .split[data-id="${el.dataset.id}"]`)
    .get()
}

function setPercents(container, split, precision) {
  const sizes = split.getSizes().map(s => round(s, precision))
  $(container).find('.percent').each(function(i, el) {
    el.innerHTML = sizes[i] + '%'
  })
}

function createSplits(container) {
  const splits = $(container)
    .find('.pane')
    .map(i => createSplit(`${container} .pane[data-id="${i}"]`, 'horizontal'))
    .get()

  setPaneHeights(container)
  return splits
}

function setupEvents() {
  $('.js-resize').resizable({minWidth: '70', minHeight: '70'})
  $('#addPrior').click(addPrior)
  $('#removePrior').click(removePrior)
  $('#addEvidence').click(addEvidence)
  $('#removeEvidence').click(removeEvidence)
  $('#observed-radio').change(() => {
    isolateObservedEvent(getObserved())
  })
}

function isolateObservedEvent($observed) {
  $('#observed .pane-v').each((i, pane) => {
    const $pane = $(pane)
    if ($pane.data('id') == $observed.data('id')) {
      $pane.addClass('observed')
    } else {
      $pane.removeClass('observed')
    }
  })
  setPosterior()
}

function getObserved() {
  return $('#observed-radio input:checked')
}

function addPrior() {
  const newId = priorsSplit.getSizes().length
  priorsSplit = addSplit('#priors', priorsSplit, 'vertical')
  addPriorToEvidence(newId)
  addPriorToObserved(newId)
  addPriorToPosterior(newId)
}

function addSplit(container, split, direction) {
  const eventLabel = direction === 'vertical' ? 'H' : 'E'  
  const newId = split.getSizes().length
  split.destroy()
  $(container).append(newSplitHtml(newId, eventLabel + (newId + 1), direction))
  return createSplit(container, direction)
}

function getNumVertSplits() {
  return evidenceSplits[0].getSizes().length
}

function addPriorToEvidence(newId) {
  $('#evidence').append(newPaneHtml(newId, getNumVertSplits()))
  const newPane = `#evidence .pane[data-id="${newId}"]`
  evidenceSplits.push(createSplit(newPane, 'horizontal'))
  setPercents(newPane, last(evidenceSplits))
  setPaneHeights('#evidence')
}

function addPriorToObserved(newId) {
  $('#observed').append(newOuterPaneHtml(newId, getNumVertSplits()))
  setObserved()
  setPaneHeights('#observed')
}

function addPriorToPosterior(newId) {
  $('#posterior').append(`<div class="box pane" data-id="${newId}">
    <div class="box-label">H${newId + 1}</div>
    <span class="percent"></span>
  </div>`)
  setPosterior()
}

function newSplitHtml(i, label, direction) { 
  return `<div class="split split-${direction} box" data-id="${i}">
    <div class="box-label">${label}</div>
    <span class="percent"></span>
  </div>`
}

function newPaneHtml(id, nSplits) {
  return `<div class="pane" data-id="${id}">
    ${range(nSplits).map(i => newSplitHtml(i, `E${i + 1}`, 'horizontal')).join('')}
  </div>`
}

function newOuterPaneHtml(id, nPanes) {
  return `<div class="pane" data-id="${id}">
    ${range(nPanes).map(i => newInnerPaneHtml(i, `E${i + 1}`)).join('')}
  </div>`
}

function newInnerPaneHtml(i, label) {
  const observed = getObserved().data('id') === i ? 'observed' : ''
  return `<div class="pane-v box ${observed}" data-id="${i}">
    <div class="box-label">${label}</div>
    <span class="percent"></span>
  </div>`
}

function removePrior() {
  if (priorsSplit.getSizes().length > 2) {
    priorsSplit = removeSplit('#priors', priorsSplit, 'vertical')
    $('#evidence').find('.pane').last().remove()
    $('#observed').find('.pane').last().remove()
    $('#posterior').find('.pane').last().remove()
    setPaneHeights('#evidence')
    setPaneHeights('#observed')
    evidenceSplits.pop()
    setObserved()
    setPosterior()
  }
}

function removeSplit(container, split, direction) {
  if (split.getSizes().length > 2) {
    split.destroy()    
    $(container).find('.split').last().remove()
    split = createSplit(container, direction)
  }
  return split
}

function addEvidence() {
  evidenceSplits = evidenceSplits.map((split, i) => {
    const pane = `#evidence .pane[data-id="${i}"]`
    return addSplit(pane, split, 'horizontal')
  })

  const id = evidenceSplits[0].getSizes().length - 1
  const label = 'E' + (id + 1)

  $('#observed').find('.pane').each((i, pane) => {
    $(pane).append(verticalPaneHtml(id, label))
  })
  setObserved()

  addRadioOption(id, label)
}

function removeEvidence() {
  const nVerticalPanes = evidenceSplits[0].getSizes().length;

  evidenceSplits = evidenceSplits.map((split, i) => {
    return removeSplit(`#evidence .pane[data-id="${i}"]`, split, 'horizontal')
  })

  if (nVerticalPanes > 2) {
    $('#observed').find('.pane').each((i, p) => {
      $(p).find('.pane-v').last().remove()
    })
    setObserved()
    removeRadioOption()    
  }
}

function verticalPaneHtml(id, label) {
  return `<div class="box pane-v" data-id="${id}">
    <div class="box-label">${label}</div>
    <span class="percent"></span>
  </div>`
}

function addRadioOption(id, label) {
  $('#observed-radio').append(`<label class="radio-option">
    <input type="radio" name="observed" data-id="${id}" data-label="${label}"/>${label}
  </label>`)
}

function removeRadioOption() {
  $('.radio-option').last().remove()
  if (!getObserved()) {
    $('.radio-option')
      .last()
      .find('input')
      .prop('checked', true)

    isolateObservedEvent(getObserved())
  }
}

function setObserved($observed, $posteriorPercents) {
  $observed = $observed || $('#observed')
  $posteriorPercents = $posteriorPercents || $('#posterior').find('.percent')

  const observedPercents = getObservedPercents($observed)

  $observed.find('.pane').each((i, pane) => {
    $(pane).find('.pane-v').each((j, paneV) => {
      $(paneV).find('.percent').text(observedPercents[i][j] + '%')
    })
  })

  setPaneHeights('#observed', priorsSplit.getSizes())
  evidenceSplits.forEach((split, i) => {
    setPaneWidths(`#observed .pane[data-id="${i}"]`, split.getSizes())
  })

  setPosterior(observedPercents, $posteriorPercents)
}

function setPosterior(observedPercents, $posteriorPercents) {
  observedPercents = observedPercents || getObservedPercents($('#observed'))
  $posteriorPercents = $posteriorPercents || $('#posterior').find('.percent')
  const posteriorPercents = observedPercents.map(op => op[getObserved().data('id')])

  $posteriorPercents.each((i, percent) => {
    percent.innerHTML = posteriorPercents[i] + '%'
  })

  setPaneHeights('#posterior', posteriorPercents.map(pp => pp + '%'))
}

function getObservedPercents() {
  const transpose = matrix => zip.apply(null, matrix)
  const widths = evidenceSplits.map(s => s.getSizes())  
  const heights = priorsSplit.getSizes()
  const areas = zipWith(widths, heights, (ws, h) => ws.map(w => w * h))
  const areasTransposed = transpose(areas)
  const totals = areasTransposed.map(sum)
  const percents = zipWith(totals, areasTransposed, (t, areas) => {
    return areas.map(a => round(a / t * 100))
  })
  return transpose(percents)
}

function round(n, precision=1) {
  return Math.round(n * 10**precision) / 10**precision
}