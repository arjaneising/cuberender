# Cuberender

* Render twisty cubes and animate possible movements *

## Usage

* Embed `cuberender.css` as stylesheet and `cuberender.min.js` as JavaScript to your page.
* On the page, create a HTML structure in the likes of

```
  <div class="cuberender">
    <ul class="cube-layout">
      <li class="f">R R R R R R R R R</li>
      <li class="u">W W W W W W W W W</li>
      <li class="r">B B B B B B B B B</li>
      <li class="l">G G G G G G G G G</li>
      <li class="b">O O O O O O O O O</li>
      <li class="d">Y Y Y Y Y Y Y Y Y</li>
    </ul>

    <ol class="moves">
      <li>U</li>
      <li>R2</li>
      <li>F</li>
    </ol>
  </div>
```

* Where the `R`(ed), `W`(hite), `B`(lue) etc stand for colors a cube has on each sides `f`(ront), `u`(p) and `r`(right).
* Moves in the moves list can include: `U`, `U'`, `Ui`, `U2` for clockwise, counterclockwise, counterclockwise and double rotations of the upper layer respectively.`

-----

* Please submit an issue if you use this, or want to use this, and have trouble setting it up. *