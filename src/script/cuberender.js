;(function (win, doc) {

  var sides, layers, baseOrientation;

  sides = ['f', 'u', 'r', 'l', 'd', 'b'];
  middleMoves = ['M', 'E', 'S'];
  baseOrientation = 'rotate3D(-1, -1, 0, 45deg) ';

  layers = {
    top: {
      f: [0, 8],
      u: [0, 2],
      r: [0, 2],
      d: [0, 2],
      l: [0, 2],
      b: false
    },
    middle: {
      f: false,
      u: [3, 5],
      r: [3, 5],
      d: [3, 5],
      l: [3, 5],
      b: false
    },
    bottom: {
      f: false,
      u: [6, 8],
      r: [6, 8],
      d: [6, 8],
      l: [6, 8],
      b: [0, 8]
    }
  };



  var init = function () {
    var cuberenders = doc.querySelectorAll('.cuberender');

    [].forEach.call(cuberenders, function (wrapper) {
      var cuberender = Object.create(CuberenderProto, CuberenderProperties);
      cuberender.create(wrapper);
    });
  };



  var CuberenderProto = Object.create(null);
  var writable = { writable: true};
  var CuberenderProperties = {
    wrapper: writable,
    layout: writable,
    moves: writable,
    cubeObj: writable,
    nodes: writable,
    current: writable,
    afterTransitionLayout: writable,
    playing: writable
  };



  var isMiddleMove = function (code) {
    return middleMoves.indexOf(code.charAt(0)) !== -1;
  };


  /**
   * Deep-clones an object
   */
  var clone = function (obj) {
    if (obj === null || typeof(obj) !== 'object' || 'isActiveClone' in obj)
      return obj;

    var temp = obj.constructor();

    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        obj['isActiveClone'] = null;
          temp[key] = clone(obj[key]);
          delete obj['isActiveClone'];
      }
    }
    return temp;
  };




  CuberenderProto.create = function (wrapper) {
    this.wrapper = wrapper;


    this.nodes = {};
    this.current = -1;
    this.playing = false;

    this.readLayout();
    this.readMoves();
    this.generateCube();
    this.generateTimeline();
    this.generateNavigation();
    this.generateTimelineNavigation();

    this.playNext();
  };




  CuberenderProto.generateTimelineNavigation = function () {
    this.nodes.moves.addEventListener('click', this.playMove.bind(this));

    [].forEach.call(this.nodes.moves.querySelectorAll('li'), function (move, index) {
      var link = doc.createElement('a');
      link.href = '#';
      link.innerHTML = move.innerHTML;
      move.innerHTML = '';
      move.appendChild(link);
      link.setAttribute('data-index', index)
    });
  };




  /**
   * Reads the layout from the DOM
   * Returns the layout as object
   */
  CuberenderProto.readLayout = function () {
    var layout, layoutElm;

    layoutElm = this.wrapper.querySelector('.cube-layout');

    if (layoutElm === null) {
      return false;
    }

    layout = {};

    sides.forEach(function (side) {
      var sideElm, codes;
      sideElm = layoutElm.querySelector('.' + side);
      if (sideElm === null) {
        layout[side] = [];
        return;
      }
      codes = sideElm.innerText.split(' ');
      if (codes.length === 9) {
        layout[side] = codes;
      }
      else {
        layout[side] = [];
      }
    });

    this.layout = layout;
  };


  /**
   * Reads the moves from a cuberender wrapper
   * Returns an array of moves
   */
  CuberenderProto.readMoves = function () {
    var moves, movesElm;

    this.nodes.moves = this.wrapper.querySelector('.moves');

    if (this.nodes.moves === null) {
      return false;
    }

    moves = [].map.call(this.nodes.moves.querySelectorAll('li'), function (move) {
      return {
        code: move.innerText,
        highlight: move.getAttribute('data-highlight') || null
      };
    });

    this.moves = moves;
  };


  /**
   * Generates DOM nodes to display a cube
   * Appends it to the wrapper
   * Returns the Node reference to the cube
   */
  CuberenderProto.generateCube = function () {
    var elm, cubeElm;

    elm = 'div';
    cubeElm = doc.createElement(elm);
    cubeElm.classList.add('cube');

    cubeObj = {
      cube: cubeElm
    }

    Object.keys(layers).forEach(function (layer) {
      var layerElm = doc.createElement(elm);
      layerElm.classList.add(layer, 'layer');
      cubeObj[layer] = layerElm;
      cubeElm.appendChild(layerElm);

      Object.keys(layers[layer]).forEach(function (side) {
        var sideElm, i, faceElm;
        sideElm = doc.createElement(elm);
        sideElm.classList.add(side);
        indexes = layers[layer][side];
        layerElm.appendChild(sideElm);
        if (!indexes) {
          return;
        }
        for (i = indexes[0]; i <= indexes[1]; ++i) {
          faceElm = doc.createElement(elm);
          faceElm.classList.add(side + i);
          sideElm.appendChild(faceElm);
        }
      });
    });

    this.cubeObj = cubeObj;
    this.wrapper.appendChild(cubeElm);

    afterTransition = function () {
      paint(this.cubeObj.cube, this.afterTransitionLayout);
      this.resetCube();
      this.playNext();
    }.bind(this);

    cubeObj.top.addEventListener('webkitTransitionEnd', afterTransition);
    cubeObj.middle.addEventListener('webkitTransitionEnd', afterTransition);
  };




  /**
   * Generates a timeline object-array from a layout and moves
   * Returns the timeline object-array
   */
  CuberenderProto.generateTimeline = function () {
    var timeline, clonedLayout;

    clonedLayout = clone(this.layout);

    timeline = this.moves.map(function (move) {
      var toReturn, turnFunction;

      toReturn = {
        code: move.code,
        highlight: move.highlight,
        cssRotates: getCssRotate(move.code)
      };

      clonedLayout = rotateLayout(clonedLayout, move.code, false);

      toReturn.beforeAnimation = clone(clonedLayout);

      if (isMiddleMove(move.code)) {
        turnFunction = turnMiddle;
      }
      else {
        turnFunction = turnFront;
      }

      switch (move.code.charAt(1)) {
        case "'":
        case 'i':
          clonedLayout = turnFunction(clonedLayout, true);
          break;
        case '2':
          clonedLayout = turnFunction(turnFunction(clonedLayout));
          break;
        default:
          clonedLayout = turnFunction(clonedLayout, false);
          break;
      }

      toReturn.afterAnimation = clone(clonedLayout);
      clonedLayout = rotateLayout(clonedLayout, move.code, true);

      return toReturn;
    });

    this.timeline = timeline;
  };



  /**
   * Gets colors
   */
  var getColor = function (color) {
    switch (color) {
      case 'R': return '#C41E3A';
      case 'G': return '#009E60';
      case 'B': return '#0051BA';
      case 'O': return '#FF5800';
      case 'Y': return '#FFD500';
      case 'W': return '#FFF';
    }
    return 'gray';
  };


  /**
   * Figures out how to CSS rotate the cube to perform a certain move
   */
  var getCssRotate = function (move) {
    switch (move.charAt(0)) {
      case 'F': 
      case 'S':
        return '';
      case 'U': return 'rotateX(90deg)';
      case 'D':
      case 'E':
        return 'rotateX(-90deg)';
      case 'B': return 'rotateX(180deg)';
      case 'L':
      case 'M':
        return 'rotateY(-90deg)';
      case 'R': return 'rotateY(90deg)';
    }
  };


  /**
   * Based on a layout, it calculates the new layout when the cube moves to front,
   * Or -when it needs to move back.
   */
  var rotateLayout = function (layout, front, back) {
    var clonedLayout = clone(layout);

    switch (front.charAt(0) + (back ? 'i' : '')) {
      case 'F':
      case 'Fi':
      case 'S':
      case 'Si': return {
        f: clonedLayout.f,
        u: clonedLayout.u,
        r: clonedLayout.r,
        b: rotateFace(rotateFace(clonedLayout.b)),
        l: clonedLayout.l,
        d: clonedLayout.d
      };
      case 'U': return {
        f: rotateFace(rotateFace(clonedLayout.u)),
        u: clonedLayout.b,
        r: rotateFace(clonedLayout.r, true),
        b: clonedLayout.d,
        l: rotateFace(clonedLayout.l, false),
        d: clonedLayout.f
      };
      case 'Ui': return {
        f: clonedLayout.d,
        u: rotateFace(rotateFace(clonedLayout.f)),
        r: rotateFace(clonedLayout.r, false),
        b: clonedLayout.u,
        l: rotateFace(clonedLayout.l, true),
        d: clonedLayout.b
      };
      case 'B': return {
        f: rotateFace(rotateFace(clonedLayout.b)),
        u: rotateFace(rotateFace(clonedLayout.d)),
        r: rotateFace(rotateFace(clonedLayout.r)),
        b: clonedLayout.f,
        l: rotateFace(rotateFace(clonedLayout.l)),
        d: rotateFace(rotateFace(clonedLayout.u))
      };
      case 'Bi': return {
        f: clonedLayout.b,
        u: rotateFace(rotateFace(clonedLayout.d)),
        r: rotateFace(rotateFace(clonedLayout.r)),
        b: rotateFace(rotateFace(clonedLayout.f)),
        l: rotateFace(rotateFace(clonedLayout.l)),
        d: rotateFace(rotateFace(clonedLayout.u))
      };
      case 'D':
      case 'E': return {
        f: clonedLayout.d,
        u: rotateFace(rotateFace(clonedLayout.f)),
        r: rotateFace(clonedLayout.r, false),
        b: rotateFace(rotateFace(clonedLayout.u)),
        l: rotateFace(clonedLayout.l, true),
        d: rotateFace(rotateFace(clonedLayout.b))
      };
      case 'Di':
      case 'Ei': return {
        f: rotateFace(rotateFace(clonedLayout.u)),
        u: rotateFace(rotateFace(clonedLayout.b)),
        r: rotateFace(clonedLayout.r, true),
        b: rotateFace(rotateFace(clonedLayout.d)),
        l: rotateFace(clonedLayout.l, false),
        d: clonedLayout.f
      };
      case 'L':
      case 'M': return {
        f: rotateFace(clonedLayout.l, false),
        u: rotateFace(clonedLayout.u, true),
        r: rotateFace(clonedLayout.f, false),
        b: rotateFace(clonedLayout.r, false),
        l: rotateFace(clonedLayout.b, true),
        d: rotateFace(clonedLayout.d, false)
      };
      case 'Li':
      case 'Mi': return {
        f: rotateFace(clonedLayout.r, true),
        u: rotateFace(clonedLayout.u, false),
        r: rotateFace(clonedLayout.b, true),
        b: rotateFace(clonedLayout.l, false),
        l: rotateFace(clonedLayout.f, true),
        d: rotateFace(clonedLayout.d, true)
      };
      case 'R': return {
        f: rotateFace(clonedLayout.r, true),
        u: rotateFace(clonedLayout.u, false),
        r: rotateFace(clonedLayout.b, false),
        b: rotateFace(clonedLayout.l, true),
        l: rotateFace(clonedLayout.f, true),
        d: rotateFace(clonedLayout.d, true)
      };
      case 'Ri': return {
        f: rotateFace(clonedLayout.l, false),
        u: rotateFace(clonedLayout.u, true),
        r: rotateFace(clonedLayout.f, false),
        b: rotateFace(clonedLayout.r, true),
        l: rotateFace(clonedLayout.b, false),
        d: rotateFace(clonedLayout.d, false)
      };
    }
  };



  /**
   * Rotate a certain layout's front face clockwise or anticlockwise
   * Returns the new layout
   */
  var turnFront = function (layout, anticlockwise) {
    var clonedLayout = clone(layout);
    return {
      f: rotateFace(clonedLayout.f, anticlockwise),
      u: rotateSide(clonedLayout.u, clonedLayout.l, clonedLayout.r, anticlockwise),
      r: rotateSide(clonedLayout.r, clonedLayout.u, clonedLayout.d, anticlockwise),
      d: rotateSide(clonedLayout.d, clonedLayout.r, clonedLayout.l, anticlockwise),
      l: rotateSide(clonedLayout.l, clonedLayout.d, clonedLayout.u, anticlockwise),
      b: clonedLayout.b
    };
  };



  var turnMiddle = function (layout, anticlockwise) {
    var clonedLayout = clone(layout);
    return {
      f: clonedLayout.f,
      u: rotateMiddle(clonedLayout.u, clonedLayout.l, clonedLayout.r, anticlockwise),
      r: rotateMiddle(clonedLayout.r, clonedLayout.u, clonedLayout.d, anticlockwise),
      d: rotateMiddle(clonedLayout.d, clonedLayout.r, clonedLayout.l, anticlockwise),
      l: rotateMiddle(clonedLayout.l, clonedLayout.d, clonedLayout.u, anticlockwise),
      b: clonedLayout.b
    }
  };


  /**
   * Rotate a face (an array of colors in order to form that face)
   * Clockwise or anticlockwise
   */
  var rotateFace = function (face, anticlockwise) {
    var clonedFace = clone(face);
    if (anticlockwise) {
      return rotateFace(rotateFace(rotateFace(clonedFace)));
    }
    return [
      clonedFace[6],
      clonedFace[3],
      clonedFace[0],
      clonedFace[7],
      clonedFace[4],
      clonedFace[1],
      clonedFace[8],
      clonedFace[5],
      clonedFace[2]
    ];
  };


  /**
   * Rotate a side when the front face is moved
   * Returns the new side
   */
  var rotateSide = function (sideA, sideB, sideD, anticlockwise) {
    var clonedSide, sideMerge;
    clonedSide = clone(sideA);
    sideMerge = anticlockwise ? clone(sideD) : clone(sideB);
    return [
      sideMerge[0],
      sideMerge[1],
      sideMerge[2],
      clonedSide[3],
      clonedSide[4],
      clonedSide[5],
      clonedSide[6],
      clonedSide[7],
      clonedSide[8]
    ]
  };

  var rotateMiddle = function (sideA, sideB, sideD, anticlockwise) {
    var clonedSide, sideMerge;
    clonedSide = clone(sideA);
    sideMerge = anticlockwise ? clone(sideD) : clone(sideB);
    return [
      clonedSide[0],
      clonedSide[1],
      clonedSide[2],
      sideMerge[3],
      sideMerge[4],
      sideMerge[5],
      clonedSide[6],
      clonedSide[7],
      clonedSide[8]
    ]
  };






  /**
   * Paints all the faces in a cube to match the layout
   */
  var paint = function (cube, layout) {
    sides.forEach(function (side) {
      layout[side].forEach(function (color, index) {
        cube.querySelector('.' + side + index).style.background = getColor(color);
      });
    });
  };


  var highlight = function (cube, highlight) {
    [].forEach.call(cube.querySelectorAll('.highlight'), function (previous) {
      previous.classList.remove('highlight');
    });

    if (!highlight) {
      return;
    }

    [].forEach.call(cube.querySelectorAll('.' + highlight.split(',').join(',.')), function (next) {
      next.classList.add('highlight');
    });
  };



  CuberenderProto.generateNavigation = function () {
    var button, previous, play, next, nav;

    button = 'button';

    nav = doc.createElement('nav');

    previous = doc.createElement(button);
    previous.classList.add('previous');
    previous.innerHTML = 'Previous';
    nav.appendChild(previous);

    play = doc.createElement(button);
    play.classList.add('play');
    play.innerHTML = 'Play';
    nav.appendChild(play);

    next = doc.createElement(button);
    next.classList.add('next');
    next.innerHTML = 'Next';
    nav.appendChild(next);

    previous.addEventListener('click', this.playPrevious.bind(this));
    play.addEventListener('click', this.playPause.bind(this));
    next.addEventListener('click', this.playNext.bind(this));

    this.wrapper.insertBefore(nav, this.nodes.moves);

    this.nodes.navigation = nav;
  };


  CuberenderProto.resetCube = function () {
    this.cubeObj.top.classList.remove('rotate-anticlockwise', 'rotate-clockwise', 'rotate-twice');
    this.cubeObj.middle.classList.remove('rotate-anticlockwise', 'rotate-clockwise', 'rotate-twice');
  };


  CuberenderProto.playMove = function (event) {
    var moveIndex;
    event.preventDefault();
    moveIndex = parseInt('0' + event.target.getAttribute('data-index'), 10);
    this.current = moveIndex - 1;
    this.playNext();
  };


  CuberenderProto.playPause = function () {
    this.playing = !this.playing;
    this.current = Math.max(this.current - 1, -1);
    this.playNext();
  };



  CuberenderProto.playPrevious = function () {
    this.current = Math.max(this.current - 2, -1);
    this.playNext();
  };



  CuberenderProto.playNext = function () {
    var move, moveNode, cube, top, moddle, moveIndex, rotatable;

    this.resetCube();

    cube = this.cubeObj.cube;
    top = this.cubeObj.top;
    middle = this.cubeObj.middle;

    moveIndex = ++this.current;

    if (moveIndex >= this.timeline.length) {
      --this.current;
      return;
    }

    move = this.timeline[moveIndex];
    paint(cube, move.beforeAnimation);
    highlight(cube, move.highlight);
    this.afterTransitionLayout = move.afterAnimation;

    rotatable = isMiddleMove(move.code) ? middle : top;

    cube.style.transform = baseOrientation + move.cssRotates;

    if (this.playing) {
      setTimeout(function () {
        var className;
        switch (move.code.charAt(1)) {
          case "'":
          case 'i':
            className = 'rotate-anticlockwise';
            break;
          case '2':
            className = 'rotate-twice';
            break;
          default:
            className = 'rotate-clockwise';
            break;
        }
        rotatable.classList.add(className);
      }, 1000);
    }

    moveNode = this.nodes.moves.querySelector('li.is-playing');

    if (moveNode) {
      moveNode.classList.remove('is-playing');
    }

    this.nodes.moves.querySelector('li:nth-child(' + (moveIndex + 1) + ')').classList.add('is-playing');
  };

  init();




})(window, document);