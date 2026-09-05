# Literature Review: Contactless Palmprint Recognition

## Paper

**Title:** Mobile Contactless Palmprint Recognition: Use of Multiscale, Multimodel Embeddings
**Authors:** Steven A. Grosz, Akash Godbole, Anil K. Jain (Michigan State University)
**Venue:** arXiv:2401.08111 [cs.CV], submitted January 16, 2024
**Link:** https://arxiv.org/abs/2401.08111

## Summary

The paper introduces **Palm-ID**, an end-to-end, mobile-deployable contactless palmprint
recognition system. Its central idea is that prior work extracts either *global*
features (overall palm shape/structure) or *local* features (fine ridge/line texture)
but rarely both — Palm-ID fuses a Vision Transformer (global features) with a
CNN (local features) into a single compact embedding, then applies a palmprint
enhancement module and a non-linear dimensionality-reduction step so the final
template is small and fast enough to match on a phone.

### Experiments

- **Training:** 5,361 unique palms / 115,972 images, pooled from several public
  and private databases (MSU-CPDB/APDB variants, CASIA Multispectral, Tongji,
  11K Hands).
- **Validation:** 2,512 unique palms / 49,955 images (SMPD, COEP, KTU, and
  proprietary sets).
- **Testing:** 2,399 unique palms / 36,036 images, including a newly collected,
  *time-separated* MSU dataset (5–13 months between the two captures of the
  same palm) plus CASIA, IITD v1, and NTU Controlled — a genuinely
  cross-database protocol, i.e. the model is never tested on a database it
  was trained on.
- Both **1:1 verification** (authentication) and **1:N** identification
  (gallery of 4,377 unique palms) protocols are evaluated.

### Results

| Dataset | TAR @ FAR=0.01% |
|---|---|
| CASIA | 99.53% |
| IITD v1 | 99.95% |
| NTU-CP-v1 | 99.08% |
| MSU time-separated (adult) | 98.06% |
| MSU time-separated (child) | 88.24% |

- Identification: 98.24% average rank-1 accuracy across five datasets; FNIR of
  4.42% at FPIR=1% (vs. a 32.23% baseline).
- Efficiency: unification model produces a **516-byte** template in **18ms**,
  and a 1:10,000-gallery search runs in **0.33ms** on a 32-core CPU — the
  numbers that make the system viable on a mobile device.
- Fusing Palm-ID's score with a commercial matcher (Armatura) pushes several
  of the above numbers further (e.g. IITD to 100%, CASIA to 99.88%).

### Conclusions

Combining global (ViT) and local (CNN) features, plus a purpose-built
enhancement module, measurably improves matching accuracy over prior
single-branch approaches, *and* the resulting pipeline is small and fast
enough to run entirely on a phone — the paper frames this dual accuracy/
efficiency result as its main contribution.

### Limitations & Future Work

- Accuracy drops noticeably on the *child* time-separated split (88.24% vs.
  98.06% for adults), which the authors attribute to greater physical change
  in a growing hand over the 5–13 month gap.
- Heavily over-saturated or occluded contactless captures remain a failure
  mode.
- The authors note plans to publicly release the new MSU PalmPrint Database
  and the mobile capture app, and flag further score-level fusion with
  complementary matchers and dedicated study of infant/child palmprint
  recognition as open directions.

### Direct Quotes

1. "requiring just 18ms to extract a template of size 516 bytes"
2. "achieving a TAR of 98.06% at FAR=0.01% on a newly collected, time-separated dataset"
3. "Cross-database and time-separated evaluations demonstrate the robustness and practical applicability of the proposed method"

*(Grosz, Godbole & Jain, 2024, arXiv:2401.08111)*

## How This Connects to This Project

This project's own `bio_palm.py` follows the same two-stage spirit at a much
smaller scale: crop the palm ROI, then run it through a CNN (MobileNetV2)
for a fixed-size embedding. Palm-ID's central lesson — that fusing a
global-shape signal with a local-texture signal beats either alone — is a
natural next improvement if this project's palm accuracy needs to go
further than the single-CNN baseline benchmarked in
`backend/benchmarks/eval_palm.py`.
