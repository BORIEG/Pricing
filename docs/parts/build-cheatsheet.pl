#!/usr/bin/perl
# Assembles cheatsheet.html from parts/cs-<page>.html (in course order) and parts/gl-<page>.html (merged, de-duplicated, sorted).
use strict; use warnings; use utf8;
my $root = shift // '..';
my @order = qw(toolkit equity fx-forward bond repo futures commodity-swap-futures stir-futures bond-futures fra irs nds xccy
  asset-swap trs inflation-swap cds cds-index tranche mbs options-intro futures-options fx-options capfloor swaption cms-spread
  cds-option lpi fx-digitals fva var-vol-swaps correlation-swap structured);
sub slurp { my $f = shift; open my $h, '<:utf8', $f or return ''; local $/; my $s = <$h>; close $h; return $s; }
my (@cards, @missing, %gl);
for my $p (@order) {
  my $cs = slurp("$root/parts/cs-$p.html");
  if ($cs) { push @cards, $cs } else { push @missing, $p }
  my $g = slurp("$root/parts/gl-$p.html");
  while ($g =~ m{<dt>(.*?)</dt>\s*<dd>(.*?)</dd>}gs) {
    my ($t, $d) = ($1, $2); (my $k = lc $t) =~ s/<[^>]+>//g; $k =~ s/^\W+//;
    $gl{$k} //= [$t, $d, $p];
  }
}
my $cards = join "\n", @cards;
my $gloss = join "\n", map { my ($t, $d, $p) = @{$gl{$_}}; "<dt>$t</dt><dd>$d <a href=\"$p.html\">→</a></dd>" } sort keys %gl;
my $n = scalar keys %gl;
my $html = <<"HTML";
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Pricing Desk Cheat Sheet</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght\@75..125,400..800&family=JetBrains+Mono:wght\@400;600&family=Source+Serif+4:ital,opsz,wght\@0,8..60,400..700;1,8..60,400..600&display=swap">
<link rel="stylesheet" href="assets/course.css">
</head>
<body data-page="cheatsheet.html">
<div class="shell">
<aside class="toc" id="toc"></aside>
<main class="page">
<header class="ph">
  <p class="eyebrow">Reference</p>
  <h1>Cheat sheet &amp; glossary</h1>
  <p class="lede">Every PV formula and the greeks that matter, one card per page, in course order. Below them, every term the course defines.</p>
</header>
<section class="sec" id="formulas">
  <h2>Formulas</h2>
  <p>Notation used throughout: <var>N</var> notional, <var>τ</var> accrual year fraction, <var>D</var>(<var>t</var>) discount factor from the OIS curve, <var>F</var> forward, <var>K</var> strike or fixed rate, <var>T</var> time to expiry in years, N(<var>x</var>) the normal probability table.</p>
  <div class="cs-grid">
$cards
  </div>
</section>
<section class="sec" id="glossary">
  <h2>Glossary <small class="mono">($n terms)</small></h2>
  <dl class="gloss">
$gloss
  </dl>
</section>
</main>
</div>
<script src="assets/course.js"></script>
</body>
</html>
HTML
open my $o, '>:utf8', "$root/cheatsheet.html" or die $!; print $o $html; close $o;
print "cards: ", scalar(@cards), "  glossary terms: $n\n";
print "missing cards: @missing\n" if @missing;
