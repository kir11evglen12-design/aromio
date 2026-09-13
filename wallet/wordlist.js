/**
 * The 256-word list a demo recovery phrase is drawn from.
 *
 * Deliberately not the BIP-39 list: a phrase minted here must never be
 * mistaken for one that controls real funds. Twelve words out of 256 give
 * 96 bits of entropy, which is plenty to keep two demo wallets apart.
 */
(function (global) {
  "use strict";

  var WORDS = [
    "abbey", "adobe", "agent", "alien", "amber", "angle", "arbor", "arrow",
    "atlas", "autumn", "badge", "baker", "banjo", "basin", "beacon", "bear",
    "belt", "berry", "bison", "bloom", "boat", "boot", "bridge", "bubble",
    "buffalo", "bunny", "cabin", "cactus", "camel", "canoe", "canyon", "cargo",
    "cave", "chain", "charm", "cherry", "chief", "cider", "clay", "clock",
    "coal", "cocoa", "coin", "copper", "corn", "cotton", "crate", "crest",
    "crystal", "curve", "dance", "deck", "denim", "diesel", "dinner", "dome",
    "dove", "dream", "dune", "eagle", "east", "edge", "ember", "engine",
    "error", "exit", "farm", "fence", "fiber", "filter", "fire", "flask",
    "float", "flower", "forest", "fountain", "frost", "fusion", "garlic", "gauge",
    "glacier", "glove", "gold", "gorge", "grape", "grass", "guitar", "harbor",
    "harvest", "heart", "helmet", "heron", "hollow", "horizon", "horse", "hunter",
    "igloo", "ingot", "iron", "jacket", "jaguar", "jelly", "jockey", "judge",
    "jungle", "kelp", "kilo", "kite", "knight", "ladder", "lake", "lark",
    "lava", "layer", "legend", "leopard", "lever", "lilac", "linen", "liquid",
    "lobby", "lodge", "lumber", "magnet", "maple", "market", "meadow", "mercury",
    "metal", "mint", "mitten", "mocha", "monkey", "moose", "mosaic", "mound",
    "muffin", "mushroom", "nectar", "nest", "night", "node", "nova", "nutmeg",
    "octagon", "onion", "opal", "orbit", "organ", "oven", "oxide", "palm",
    "panther", "parade", "pasta", "pearl", "pecan", "penguin", "phoenix", "pigeon",
    "pine", "plasma", "plum", "polar", "pony", "portal", "powder", "puddle",
    "pumpkin", "quail", "queen", "quill", "rabbit", "radio", "rail", "ranch",
    "reef", "resin", "ridge", "robin", "rocket", "rook", "rover", "rudder",
    "rust", "sage", "salmon", "sapphire", "scarf", "scout", "shale", "shelf",
    "shore", "shuttle", "silver", "slate", "slope", "snake", "soil", "sonar",
    "south", "spice", "spiral", "spruce", "stable", "stamp", "steam", "storm",
    "straw", "studio", "sunset", "swan", "syrup", "taiga", "tavern", "temple",
    "thistle", "thread", "tide", "tissue", "token", "torch", "totem", "trace",
    "train", "treasure", "trench", "trout", "tulip", "tunnel", "twig", "unicorn",
    "urban", "valley", "vapor", "verse", "vine", "viper", "vortex", "wagon",
    "warden", "wave", "weather", "whale", "wheel", "whistle", "winter", "wombat",
    "wool", "wrench", "yard", "yeast", "yogurt", "zenith", "zinc", "zone"
  ];

  if (WORDS.length !== 256) throw new Error("wordlist must hold exactly 256 words");

  var api = { WORDS: WORDS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.Wordlist = api;
})(typeof window !== "undefined" ? window : globalThis);
