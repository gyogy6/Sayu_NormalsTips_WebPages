[日本語](README.ja.md) | [English](README.md) | [한국어](README.ko.md)

# 법선 Tips (그림 설명)

3DCG의 **법선(노멀)** 을 애니메이션과 움직이는 그림으로 설명하는 자료입니다.

**▶ 움직이는 그림 (GitHub Pages): https://gyogy6.github.io/Sayu_NormalsTips_WebPages/ko/**

![법선과 빛의 각도](images/ch01_ndotl.gif)

## 목차

1. [법선이란](ko/01_what-is-a-normal.md) — 면의 방향과 빛의 각도로 밝기가 정해지는 원리
2. [면 법선과 정점 법선](ko/02_face-and-vertex-normals.md) — 플랫과 스무스, 각도로 나누는 방법
3. [정점 법선을 평균 내는 방법](ko/03_averaging-vertex-normals.md) — 단순 평균, 면적 가중치, 각도 가중치
4. [하드 엣지와 UV 이음매](ko/04_hard-edges-and-uv-seams.md) — 정점이 나뉘어도 그림자는 갈라지지 않는다. 갈라지는 것은 법선이 나뉠 때
5. [커스텀 법선](ko/05_custom-normals.md) — 모양은 그대로, 그림자만 바꾼다
6. [따로 있는 메시의 이음매](ko/06_seams-between-meshes.md) — 그림자가 갈라지는 이유와 법선을 맞추는 일반적인 방법
7. [툰에서 법선 차이가 눈에 띄는 이유](ko/07_why-toon-shows-normal-errors.md) — 임계값과 면이 휘는 정도
8. [노멀 맵과의 관계](ko/08_normal-maps.md) — 노멀 맵은 정점 법선을 바탕으로 한다
9. [내보내기·불러오기에서 주의할 점](ko/09_export-and-import.md) — 법선은 도중에 다시 만들어질 수 있다

## 라이선스

- 글과 그림: [CC BY 4.0](LICENSE-docs.md)
- 코드: [MIT](LICENSE)
