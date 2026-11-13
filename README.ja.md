[日本語](README.ja.md) | [English](README.md) | [한국어](README.ko.md)

# 法線の Tips（図解）

3DCG の **法線（ノーマル）** の考え方を、アニメーションと触れる図で説明する資料です。

**▶ 触れる図（GitHub Pages）：https://gyogy6.github.io/Sayu_NormalsTips_WebPages/ja/**

![法線と光の角度](images/ch01_ndotl.gif)

## 目次

1. [法線とは](ja/01_what-is-a-normal.md) — 面の向きと、光との角度で明るさが決まるしくみ
2. [面の法線と頂点の法線](ja/02_face-and-vertex-normals.md) — フラットとスムーズ、角度で分ける方法
3. [頂点法線の平均のしかた](ja/03_averaging-vertex-normals.md) — 単純平均・面積の重み・角度の重み
4. [ハードエッジと UV の継ぎ目](ja/04_hard-edges-and-uv-seams.md) — 頂点が分かれても影は割れない。割れるのは法線が分かれたとき
5. [カスタム法線](ja/05_custom-normals.md) — 形はそのままで、影だけを変える
6. [別々のメッシュの継ぎ目](ja/06_seams-between-meshes.md) — 影が割れる理由と、法線をそろえる一般的な方法
7. [トゥーンで法線の差が目立つ理由](ja/07_why-toon-shows-normal-errors.md) — しきい値と、面の曲がり方
8. [ノーマルマップとの関係](ja/08_normal-maps.md) — ノーマルマップは頂点の法線を土台にしている
9. [書き出し・読み込みでの注意](ja/09_export-and-import.md) — 法線は途中で作り直されることがある

## ライセンス

- 文章と図：[CC BY 4.0](LICENSE-docs.md)
- コード：[MIT](LICENSE)
