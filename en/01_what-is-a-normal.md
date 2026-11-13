[日本語](../ja/01_what-is-a-normal.md) | [English](../en/01_what-is-a-normal.md) | [한국어](../ko/01_what-is-a-normal.md)

[Contents](../README.md) · Next: [2. Face normals and vertex normals →](02_face-and-vertex-normals.md)

# 1. What is a normal?

![Surface normal N, light direction L, the angle θ and brightness](../images/ch01_ndotl.gif)

*Left: a surface with its normal N, the direction L the light comes from, and the angle θ between them. Middle: brightness against θ (black: smooth brightness, purple: toon, split into two steps at a threshold of 0.3). Right: a sphere under the same light (left smooth, right toon).*

**▶ Try it: [interactive figure (GitHub Pages)](https://gyogy6.github.io/Sayu_NormalsTips/en/ch01.html)**

## A normal says which way a surface faces

A **normal** is an arrow perpendicular to a surface. It is kept at length 1 (a unit vector).

Almost all lighting in 3D graphics is computed from normals. Brightness is decided by **the direction of the normal**, not by the position or shape of the surface itself.

## Brightness comes from the angle to the light

The most basic lighting is one line:

```
brightness = max(0, N · L)
```

- `N`: the normal (length 1)
- `L`: the direction from the surface toward the light (length 1)
- `N · L`: the dot product. For two unit vectors it equals **the cosine of the angle θ between them**.

| Light | θ | N·L | Brightness |
|---|---|---|---|
| Straight on | 0° | 1 | 1 (brightest) |
| At a slant | 60° | 0.5 | 0.5 |
| From the side | 90° | 0 | 0 |
| From behind | more than 90° | negative | 0 (clamped by max) |

When light hits a surface at a slant, the same amount of light spreads over a larger area, so it looks darker. This model is called **Lambertian reflection**.

## Toon shading splits at a threshold

Toon (cel) shading usually replaces smooth brightness with two colors, chosen by whether `N·L` is above a **threshold**:

```
color = (N · L > threshold) ? lit color : shadow color
```

That is the purple line in the graph. With smooth brightness (black line), a small change of angle gives only a small change of brightness. With toon shading, the color flips as soon as the threshold is crossed. **Near the threshold, a tiny difference in the normal becomes a sharp shadow line.** This is why uneven normals stand out so much in toon shading.

## Worth remembering

1. **Normals decide the shading.** The same shape with different normals shades differently, and different shapes with the same normals shade the same. The later chapters (custom normals, seams between meshes) are all built on this.
2. **Keep the length at 1 (normalize).** A dot product with a non-unit normal gives wrong brightness. After adding or blending normals, always bring the length back to 1.
3. **Faces have a front and a back.** The direction of a face normal comes from the order of its vertices (in many environments, counter-clockwise seen from the front is the front). If the order is reversed, the normal points backward: the shading flips, or the face may disappear.

## Summary

- A normal is a unit-length direction perpendicular to the surface.
- Basic brightness is `max(0, N·L)`, the cosine of the angle to the light.
- Toon shading splits at a threshold, so small normal differences near it become visible.

---

[Contents](../README.md) · Next: [2. Face normals and vertex normals →](02_face-and-vertex-normals.md)
