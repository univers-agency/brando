defmodule Brando.Utils do
  @moduledoc """
  Assorted utility functions.
  """

  import Plug.Conn, only: [assign: 3]
  require Logger

  @ucmap %{
    "\x{2d}" => "-", "\x{20}" => "-", "\x{24}" => "", "\x{26}" => "and",
    "\x{30}" => "0", "\x{31}" => "1", "\x{32}" => "2", "\x{33}" => "3",
    "\x{34}" => "4", "\x{35}" => "5", "\x{36}" => "6", "\x{37}" => "7",
    "\x{38}" => "8", "\x{39}" => "9", "\x{41}" => "A", "\x{42}" => "B",
    "\x{43}" => "C", "\x{44}" => "D", "\x{45}" => "E", "\x{46}" => "F",
    "\x{47}" => "G", "\x{48}" => "H", "\x{49}" => "I", "\x{50}" => "P",
    "\x{51}" => "Q", "\x{52}" => "R", "\x{53}" => "S", "\x{54}" => "T",
    "\x{55}" => "U", "\x{56}" => "V", "\x{57}" => "W", "\x{58}" => "X",
    "\x{59}" => "Y", "\x{61}" => "a", "\x{62}" => "b", "\x{63}" => "c",
    "\x{64}" => "d", "\x{65}" => "e", "\x{66}" => "f", "\x{67}" => "g",
    "\x{68}" => "h", "\x{69}" => "i", "\x{70}" => "p", "\x{71}" => "q",
    "\x{72}" => "r", "\x{73}" => "s", "\x{74}" => "t", "\x{75}" => "u",
    "\x{76}" => "v", "\x{77}" => "w", "\x{78}" => "x", "\x{79}" => "y",
    "\x{100}" => "A", "\x{101}" => "a", "\x{102}" => "A", "\x{103}" => "a",
    "\x{104}" => "A", "\x{105}" => "a", "\x{106}" => "C", "\x{107}" => "c",
    "\x{108}" => "C", "\x{109}" => "c", "\x{110}" => "D", "\x{111}" => "d",
    "\x{112}" => "E", "\x{113}" => "e", "\x{114}" => "E", "\x{115}" => "e",
    "\x{116}" => "E", "\x{117}" => "e", "\x{118}" => "E", "\x{119}" => "e",
    "\x{120}" => "G", "\x{121}" => "g", "\x{122}" => "G", "\x{123}" => "g",
    "\x{124}" => "H", "\x{125}" => "h", "\x{126}" => "H", "\x{127}" => "h",
    "\x{128}" => "I", "\x{129}" => "i", "\x{130}" => "I", "\x{131}" => "i",
    "\x{132}" => "IJ", "\x{133}" => "ij", "\x{134}" => "J", "\x{135}" => "j",
    "\x{136}" => "K", "\x{137}" => "k", "\x{138}" => "k", "\x{139}" => "L",
    "\x{140}" => "l", "\x{141}" => "L", "\x{142}" => "l", "\x{143}" => "N",
    "\x{144}" => "n", "\x{145}" => "N", "\x{146}" => "n", "\x{147}" => "N",
    "\x{148}" => "n", "\x{149}" => "n", "\x{150}" => "O", "\x{151}" => "o",
    "\x{152}" => "OE", "\x{153}" => "oe", "\x{154}" => "R", "\x{155}" => "r",
    "\x{156}" => "R", "\x{157}" => "r", "\x{158}" => "R", "\x{159}" => "r",
    "\x{160}" => "S", "\x{161}" => "s", "\x{162}" => "T", "\x{163}" => "t",
    "\x{164}" => "T", "\x{165}" => "t", "\x{166}" => "T", "\x{167}" => "t",
    "\x{168}" => "U", "\x{169}" => "u", "\x{170}" => "U", "\x{171}" => "u",
    "\x{172}" => "U", "\x{173}" => "u", "\x{174}" => "W", "\x{175}" => "w",
    "\x{176}" => "Y", "\x{177}" => "y", "\x{178}" => "Y", "\x{179}" => "Z",
    "\x{180}" => "b", "\x{181}" => "B", "\x{182}" => "b", "\x{183}" => "b",
    "\x{184}" => "b", "\x{185}" => "b", "\x{186}" => "C", "\x{187}" => "C",
    "\x{188}" => "c", "\x{189}" => "D", "\x{190}" => "E", "\x{191}" => "F",
    "\x{192}" => "f", "\x{193}" => "G", "\x{194}" => "Y", "\x{195}" => "h",
    "\x{196}" => "i", "\x{197}" => "I", "\x{198}" => "K", "\x{199}" => "k",
    "\x{200}" => "A", "\x{201}" => "a", "\x{202}" => "A", "\x{203}" => "a",
    "\x{204}" => "E", "\x{205}" => "e", "\x{206}" => "E", "\x{207}" => "e",
    "\x{208}" => "I", "\x{209}" => "i", "\x{210}" => "R", "\x{211}" => "r",
    "\x{212}" => "R", "\x{213}" => "r", "\x{214}" => "U", "\x{215}" => "u",
    "\x{216}" => "U", "\x{217}" => "u", "\x{218}" => "S", "\x{219}" => "s",
    "\x{220}" => "n", "\x{221}" => "d", "\x{222}" => "8", "\x{223}" => "8",
    "\x{224}" => "Z", "\x{225}" => "z", "\x{226}" => "A", "\x{227}" => "a",
    "\x{228}" => "E", "\x{229}" => "e", "\x{230}" => "O", "\x{231}" => "o",
    "\x{232}" => "Y", "\x{233}" => "y", "\x{234}" => "l", "\x{235}" => "n",
    "\x{236}" => "t", "\x{237}" => "j", "\x{238}" => "db", "\x{239}" => "qp",
    "\x{240}" => "<", "\x{241}" => "?", "\x{242}" => "?", "\x{243}" => "B",
    "\x{244}" => "U", "\x{245}" => "A", "\x{246}" => "E", "\x{247}" => "e",
    "\x{248}" => "J", "\x{249}" => "j", "\x{250}" => "a", "\x{251}" => "a",
    "\x{252}" => "a", "\x{253}" => "b", "\x{254}" => "c", "\x{255}" => "e",
    "\x{256}" => "d", "\x{257}" => "d", "\x{258}" => "e", "\x{259}" => "e",
    "\x{260}" => "g", "\x{261}" => "g", "\x{262}" => "g", "\x{263}" => "Y",
    "\x{264}" => "x", "\x{265}" => "u", "\x{266}" => "h", "\x{267}" => "h",
    "\x{268}" => "i", "\x{269}" => "i", "\x{270}" => "w", "\x{271}" => "m",
    "\x{272}" => "n", "\x{273}" => "n", "\x{274}" => "N", "\x{275}" => "o",
    "\x{276}" => "oe", "\x{277}" => "m", "\x{278}" => "o", "\x{279}" => "r",
    "\x{280}" => "R", "\x{281}" => "R", "\x{282}" => "S", "\x{283}" => "f",
    "\x{284}" => "f", "\x{285}" => "f", "\x{286}" => "f", "\x{287}" => "t",
    "\x{288}" => "t", "\x{289}" => "u", "\x{290}" => "Z", "\x{291}" => "Z",
    "\x{292}" => "3", "\x{293}" => "3", "\x{294}" => "?", "\x{295}" => "?",
    "\x{296}" => "5", "\x{297}" => "C", "\x{298}" => "O", "\x{299}" => "B",
    "\x{363}" => "a", "\x{364}" => "e", "\x{365}" => "i", "\x{366}" => "o",
    "\x{367}" => "u", "\x{368}" => "c", "\x{369}" => "d", "\x{386}" => "A",
    "\x{388}" => "E", "\x{389}" => "H", "\x{390}" => "i", "\x{391}" => "A",
    "\x{392}" => "B", "\x{393}" => "r", "\x{394}" => "A", "\x{395}" => "E",
    "\x{396}" => "Z", "\x{397}" => "H", "\x{398}" => "O", "\x{399}" => "I",
    "\x{400}" => "E", "\x{401}" => "E", "\x{402}" => "T", "\x{403}" => "r",
    "\x{404}" => "E", "\x{405}" => "S", "\x{406}" => "I", "\x{407}" => "I",
    "\x{408}" => "J", "\x{409}" => "jb", "\x{410}" => "A", "\x{411}" => "B",
    "\x{412}" => "B", "\x{413}" => "r", "\x{414}" => "D", "\x{415}" => "E",
    "\x{416}" => "X", "\x{417}" => "3", "\x{418}" => "N", "\x{419}" => "N",
    "\x{420}" => "P", "\x{421}" => "C", "\x{422}" => "T", "\x{423}" => "y",
    "\x{424}" => "O", "\x{425}" => "X", "\x{426}" => "U", "\x{427}" => "h",
    "\x{428}" => "W", "\x{429}" => "W", "\x{430}" => "a", "\x{431}" => "6",
    "\x{432}" => "B", "\x{433}" => "r", "\x{434}" => "d", "\x{435}" => "e",
    "\x{436}" => "x", "\x{437}" => "3", "\x{438}" => "N", "\x{439}" => "N",
    "\x{440}" => "P", "\x{441}" => "C", "\x{442}" => "T", "\x{443}" => "Y",
    "\x{444}" => "qp", "\x{445}" => "x", "\x{446}" => "U", "\x{447}" => "h",
    "\x{448}" => "W", "\x{449}" => "W", "\x{450}" => "e", "\x{451}" => "e",
    "\x{452}" => "h", "\x{453}" => "r", "\x{454}" => "e", "\x{455}" => "s",
    "\x{456}" => "i", "\x{457}" => "i", "\x{458}" => "j", "\x{459}" => "jb",
    "\x{460}" => "W", "\x{461}" => "w", "\x{462}" => "Tb", "\x{463}" => "tb",
    "\x{464}" => "IC", "\x{465}" => "ic", "\x{466}" => "A", "\x{467}" => "a",
    "\x{468}" => "IA", "\x{469}" => "ia", "\x{470}" => "Y", "\x{471}" => "y",
    "\x{472}" => "O", "\x{473}" => "o", "\x{474}" => "V", "\x{475}" => "v",
    "\x{476}" => "V", "\x{477}" => "v", "\x{478}" => "Oy", "\x{479}" => "oy",
    "\x{480}" => "C", "\x{481}" => "c", "\x{490}" => "R", "\x{491}" => "r",
    "\x{492}" => "F", "\x{493}" => "f", "\x{494}" => "H", "\x{495}" => "h",
    "\x{496}" => "X", "\x{497}" => "x", "\x{498}" => "3", "\x{499}" => "3",
    "\x{500}" => "d", "\x{501}" => "d", "\x{502}" => "d", "\x{503}" => "d",
    "\x{504}" => "R", "\x{505}" => "R", "\x{506}" => "R", "\x{507}" => "R",
    "\x{508}" => "JT", "\x{509}" => "JT", "\x{510}" => "E", "\x{511}" => "e",
    "\x{512}" => "JT", "\x{513}" => "jt", "\x{514}" => "JX", "\x{515}" => "JX",
    "\x{531}" => "U", "\x{532}" => "D", "\x{533}" => "Q", "\x{534}" => "N",
    "\x{535}" => "T", "\x{536}" => "2", "\x{537}" => "F", "\x{538}" => "r",
    "\x{539}" => "p", "\x{540}" => "z", "\x{541}" => "2", "\x{542}" => "n",
    "\x{543}" => "x", "\x{544}" => "U", "\x{545}" => "B", "\x{546}" => "j",
    "\x{547}" => "t", "\x{548}" => "n", "\x{549}" => "C", "\x{550}" => "R",
    "\x{551}" => "8", "\x{552}" => "R", "\x{553}" => "O", "\x{554}" => "P",
    "\x{555}" => "O", "\x{556}" => "S", "\x{561}" => "w", "\x{562}" => "f",
    "\x{563}" => "q", "\x{564}" => "n", "\x{565}" => "t", "\x{566}" => "q",
    "\x{567}" => "t", "\x{568}" => "n", "\x{569}" => "p", "\x{570}" => "h",
    "\x{571}" => "a", "\x{572}" => "n", "\x{573}" => "a", "\x{574}" => "u",
    "\x{575}" => "j", "\x{576}" => "u", "\x{577}" => "2", "\x{578}" => "n",
    "\x{579}" => "2", "\x{580}" => "n", "\x{581}" => "g", "\x{582}" => "l",
    "\x{583}" => "uh", "\x{584}" => "p", "\x{585}" => "o", "\x{586}" => "S",
    "\x{587}" => "u", "\x{4a}" => "J", "\x{4b}" => "K", "\x{4c}" => "L",
    "\x{4d}" => "M", "\x{4e}" => "N", "\x{4f}" => "O", "\x{5a}" => "Z",
    "\x{6a}" => "j", "\x{6b}" => "k", "\x{6c}" => "l", "\x{6d}" => "m",
    "\x{6e}" => "n", "\x{6f}" => "o", "\x{7a}" => "z", "\x{a2}" => "c",
    "\x{a3}" => "f", "\x{a5}" => "Y", "\x{a7}" => "s", "\x{a9}" => "c",
    "\x{aa}" => "a", "\x{ae}" => "r", "\x{b2}" => "2", "\x{b3}" => "3",
    "\x{b5}" => "u", "\x{b6}" => "p", "\x{b9}" => "1", "\x{c0}" => "A",
    "\x{c1}" => "A", "\x{c2}" => "A", "\x{c3}" => "A", "\x{c4}" => "A",
    "\x{c5}" => "A", "\x{c6}" => "AE", "\x{c7}" => "C", "\x{c8}" => "E",
    "\x{c9}" => "E", "\x{ca}" => "E", "\x{cb}" => "E", "\x{cc}" => "I",
    "\x{cd}" => "I", "\x{ce}" => "I", "\x{cf}" => "I", "\x{d0}" => "D",
    "\x{d1}" => "N", "\x{d2}" => "O", "\x{d3}" => "O", "\x{d4}" => "O",
    "\x{d5}" => "O", "\x{d6}" => "O", "\x{d7}" => "X", "\x{d8}" => "O",
    "\x{d9}" => "U", "\x{da}" => "U", "\x{db}" => "U", "\x{dc}" => "U",
    "\x{dd}" => "Y", "\x{de}" => "p", "\x{df}" => "ss", "\x{e0}" => "a",
    "\x{e1}" => "a", "\x{e2}" => "a", "\x{e3}" => "a", "\x{e4}" => "a",
    "\x{e5}" => "a", "\x{e6}" => "ae", "\x{e7}" => "c", "\x{e8}" => "e",
    "\x{e9}" => "e", "\x{ea}" => "e", "\x{eb}" => "e", "\x{ec}" => "i",
    "\x{ed}" => "i", "\x{ee}" => "i", "\x{ef}" => "i", "\x{f0}" => "o",
    "\x{f1}" => "n", "\x{f2}" => "o", "\x{f3}" => "o", "\x{f4}" => "o",
    "\x{f5}" => "o", "\x{f6}" => "o", "\x{f8}" => "o", "\x{f9}" => "u",
    "\x{fa}" => "u", "\x{fb}" => "u", "\x{fc}" => "u", "\x{fd}" => "y",
    "\x{ff}" => "y", "\x{10a}" => "C", "\x{10b}" => "c", "\x{10c}" => "C",
    "\x{10d}" => "c", "\x{10e}" => "D", "\x{10f}" => "d", "\x{11a}" => "E",
    "\x{11b}" => "e", "\x{11c}" => "G", "\x{11d}" => "g", "\x{11e}" => "G",
    "\x{11f}" => "g", "\x{12a}" => "I", "\x{12b}" => "i", "\x{12c}" => "I",
    "\x{12d}" => "i", "\x{12e}" => "I", "\x{12f}" => "i", "\x{13a}" => "l",
    "\x{13b}" => "L", "\x{13c}" => "l", "\x{13d}" => "L", "\x{13e}" => "l",
    "\x{13f}" => "L", "\x{14a}" => "n", "\x{14b}" => "n", "\x{14c}" => "O",
    "\x{14d}" => "o", "\x{14e}" => "O", "\x{14f}" => "o", "\x{15a}" => "S",
    "\x{15b}" => "s", "\x{15c}" => "S", "\x{15d}" => "s", "\x{15e}" => "S",
    "\x{15f}" => "s", "\x{16a}" => "U", "\x{16b}" => "u", "\x{16c}" => "U",
    "\x{16d}" => "u", "\x{16e}" => "U", "\x{16f}" => "u", "\x{17a}" => "z",
    "\x{17b}" => "Z", "\x{17c}" => "z", "\x{17d}" => "Z", "\x{17e}" => "z",
    "\x{17f}" => "f", "\x{18a}" => "D", "\x{18b}" => "d", "\x{18c}" => "d",
    "\x{18d}" => "q", "\x{18e}" => "E", "\x{18f}" => "e", "\x{19a}" => "l",
    "\x{19b}" => "h", "\x{19c}" => "w", "\x{19d}" => "N", "\x{19e}" => "n",
    "\x{19f}" => "O", "\x{1a0}" => "O", "\x{1a1}" => "o", "\x{1a2}" => "P",
    "\x{1a3}" => "P", "\x{1a4}" => "P", "\x{1a5}" => "p", "\x{1a6}" => "R",
    "\x{1a7}" => "S", "\x{1a8}" => "s", "\x{1a9}" => "E", "\x{1aa}" => "l",
    "\x{1ab}" => "t", "\x{1ac}" => "T", "\x{1ad}" => "t", "\x{1ae}" => "T",
    "\x{1af}" => "U", "\x{1b0}" => "u", "\x{1b1}" => "U", "\x{1b2}" => "U",
    "\x{1b3}" => "Y", "\x{1b4}" => "y", "\x{1b5}" => "Z", "\x{1b6}" => "z",
    "\x{1b7}" => "3", "\x{1b8}" => "3", "\x{1b9}" => "3", "\x{1ba}" => "3",
    "\x{1bb}" => "2", "\x{1bc}" => "5", "\x{1bd}" => "5", "\x{1be}" => "5",
    "\x{1bf}" => "p", "\x{1c4}" => "DZ", "\x{1c5}" => "Dz", "\x{1c6}" => "dz",
    "\x{1c7}" => "Lj", "\x{1c8}" => "Lj", "\x{1c9}" => "lj", "\x{1ca}" => "NJ",
    "\x{1cb}" => "Nj", "\x{1cc}" => "nj", "\x{1cd}" => "A", "\x{1ce}" => "a",
    "\x{1cf}" => "I", "\x{1d0}" => "i", "\x{1d1}" => "O", "\x{1d2}" => "o",
    "\x{1d3}" => "U", "\x{1d4}" => "u", "\x{1d5}" => "U", "\x{1d6}" => "u",
    "\x{1d7}" => "U", "\x{1d8}" => "u", "\x{1d9}" => "U", "\x{1da}" => "u",
    "\x{1db}" => "U", "\x{1dc}" => "u", "\x{1dd}" => "e", "\x{1de}" => "A",
    "\x{1df}" => "a", "\x{1e0}" => "A", "\x{1e1}" => "a", "\x{1e2}" => "AE",
    "\x{1e3}" => "ae", "\x{1e4}" => "G", "\x{1e5}" => "g", "\x{1e6}" => "G",
    "\x{1e7}" => "g", "\x{1e8}" => "K", "\x{1e9}" => "k", "\x{1ea}" => "Q",
    "\x{1eb}" => "q", "\x{1ec}" => "Q", "\x{1ed}" => "q", "\x{1ee}" => "3",
    "\x{1ef}" => "3", "\x{1f0}" => "J", "\x{1f1}" => "dz", "\x{1f2}" => "dZ",
    "\x{1f3}" => "DZ", "\x{1f4}" => "g", "\x{1f5}" => "G", "\x{1f6}" => "h",
    "\x{1f7}" => "p", "\x{1f8}" => "N", "\x{1f9}" => "n", "\x{1fa}" => "A",
    "\x{1fb}" => "a", "\x{1fc}" => "AE", "\x{1fd}" => "ae", "\x{1fe}" => "O",
    "\x{1ff}" => "o", "\x{20a}" => "I", "\x{20b}" => "i", "\x{20c}" => "O",
    "\x{20d}" => "o", "\x{20e}" => "O", "\x{20f}" => "o", "\x{21a}" => "T",
    "\x{21b}" => "t", "\x{21c}" => "3", "\x{21d}" => "3", "\x{21e}" => "H",
    "\x{21f}" => "h", "\x{22a}" => "O", "\x{22b}" => "o", "\x{22c}" => "O",
    "\x{22d}" => "o", "\x{22e}" => "O", "\x{22f}" => "o", "\x{23a}" => "A",
    "\x{23b}" => "C", "\x{23c}" => "c", "\x{23d}" => "L", "\x{23e}" => "T",
    "\x{23f}" => "s", "\x{24a}" => "Q", "\x{24b}" => "q", "\x{24c}" => "R",
    "\x{24d}" => "r", "\x{24e}" => "Y", "\x{24f}" => "y", "\x{25a}" => "e",
    "\x{25b}" => "3", "\x{25c}" => "3", "\x{25d}" => "3", "\x{25e}" => "3",
    "\x{25f}" => "j", "\x{26a}" => "i", "\x{26b}" => "I", "\x{26c}" => "I",
    "\x{26d}" => "I", "\x{26e}" => "h", "\x{26f}" => "w", "\x{27a}" => "R",
    "\x{27b}" => "r", "\x{27c}" => "R", "\x{27d}" => "R", "\x{27e}" => "r",
    "\x{27f}" => "r", "\x{28a}" => "u", "\x{28b}" => "v", "\x{28c}" => "A",
    "\x{28d}" => "M", "\x{28e}" => "Y", "\x{28f}" => "Y", "\x{29a}" => "B",
    "\x{29b}" => "G", "\x{29c}" => "H", "\x{29d}" => "j", "\x{29e}" => "K",
    "\x{29f}" => "L", "\x{2a0}" => "q", "\x{2a1}" => "?", "\x{2a2}" => "c",
    "\x{2a3}" => "dz", "\x{2a4}" => "d3", "\x{2a5}" => "dz", "\x{2a6}" => "ts",
    "\x{2a7}" => "tf", "\x{2a8}" => "tc", "\x{2a9}" => "fn", "\x{2aa}" => "ls",
    "\x{2ab}" => "lz", "\x{2ac}" => "ww", "\x{2ae}" => "u", "\x{2af}" => "u",
    "\x{2b0}" => "h", "\x{2b1}" => "h", "\x{2b2}" => "j", "\x{2b3}" => "r",
    "\x{2b4}" => "r", "\x{2b5}" => "r", "\x{2b6}" => "R", "\x{2b7}" => "W",
    "\x{2b8}" => "Y", "\x{2df}" => "x", "\x{2e0}" => "Y", "\x{2e1}" => "1",
    "\x{2e2}" => "s", "\x{2e3}" => "x", "\x{2e4}" => "c", "\x{36a}" => "h",
    "\x{36b}" => "m", "\x{36c}" => "r", "\x{36d}" => "t", "\x{36e}" => "v",
    "\x{36f}" => "x", "\x{37b}" => "c", "\x{37c}" => "c", "\x{37d}" => "c",
    "\x{38a}" => "I", "\x{38c}" => "O", "\x{38e}" => "Y", "\x{38f}" => "O",
    "\x{39a}" => "K", "\x{39b}" => "A", "\x{39c}" => "M", "\x{39d}" => "N",
    "\x{39e}" => "E", "\x{39f}" => "O", "\x{3a0}" => "TT", "\x{3a1}" => "P",
    "\x{3a3}" => "E", "\x{3a4}" => "T", "\x{3a5}" => "Y", "\x{3a6}" => "O",
    "\x{3a7}" => "X", "\x{3a8}" => "Y", "\x{3a9}" => "O", "\x{3aa}" => "I",
    "\x{3ab}" => "Y", "\x{3ac}" => "a", "\x{3ad}" => "e", "\x{3ae}" => "n",
    "\x{3af}" => "i", "\x{3b0}" => "v", "\x{3b1}" => "a", "\x{3b2}" => "b",
    "\x{3b3}" => "y", "\x{3b4}" => "d", "\x{3b5}" => "e", "\x{3b6}" => "c",
    "\x{3b7}" => "n", "\x{3b8}" => "0", "\x{3b9}" => "1", "\x{3ba}" => "k",
    "\x{3bb}" => "j", "\x{3bc}" => "u", "\x{3bd}" => "v", "\x{3be}" => "c",
    "\x{3bf}" => "o", "\x{3c0}" => "tt", "\x{3c1}" => "p", "\x{3c2}" => "s",
    "\x{3c3}" => "o", "\x{3c4}" => "t", "\x{3c5}" => "u", "\x{3c6}" => "q",
    "\x{3c7}" => "X", "\x{3c8}" => "Y", "\x{3c9}" => "w", "\x{3ca}" => "i",
    "\x{3cb}" => "u", "\x{3cc}" => "o", "\x{3cd}" => "u", "\x{3ce}" => "w",
    "\x{3d0}" => "b", "\x{3d1}" => "e", "\x{3d2}" => "Y", "\x{3d3}" => "Y",
    "\x{3d4}" => "Y", "\x{3d5}" => "O", "\x{3d6}" => "w", "\x{3d7}" => "x",
    "\x{3d8}" => "Q", "\x{3d9}" => "q", "\x{3da}" => "C", "\x{3db}" => "c",
    "\x{3dc}" => "F", "\x{3dd}" => "f", "\x{3de}" => "N", "\x{3df}" => "N",
    "\x{3e2}" => "W", "\x{3e3}" => "w", "\x{3e4}" => "q", "\x{3e5}" => "q",
    "\x{3e6}" => "h", "\x{3e7}" => "e", "\x{3e8}" => "S", "\x{3e9}" => "s",
    "\x{3ea}" => "X", "\x{3eb}" => "x", "\x{3ec}" => "6", "\x{3ed}" => "6",
    "\x{3ee}" => "t", "\x{3ef}" => "t", "\x{3f0}" => "x", "\x{3f1}" => "e",
    "\x{3f2}" => "c", "\x{3f3}" => "j", "\x{3f4}" => "O", "\x{3f5}" => "E",
    "\x{3f6}" => "E", "\x{3f7}" => "p", "\x{3f8}" => "p", "\x{3f9}" => "C",
    "\x{3fa}" => "M", "\x{3fb}" => "M", "\x{3fc}" => "p", "\x{3fd}" => "C",
    "\x{3fe}" => "C", "\x{3ff}" => "C", "\x{40a}" => "Hb", "\x{40b}" => "Th",
    "\x{40c}" => "K", "\x{40d}" => "N", "\x{40e}" => "Y", "\x{40f}" => "U",
    "\x{41a}" => "K", "\x{41b}" => "jI", "\x{41c}" => "M", "\x{41d}" => "H",
    "\x{41e}" => "O", "\x{41f}" => "TT", "\x{42a}" => "b", "\x{42b}" => "bI",
    "\x{42c}" => "b", "\x{42d}" => "E", "\x{42e}" => "IO", "\x{42f}" => "R",
    "\x{43a}" => "K", "\x{43b}" => "JI", "\x{43c}" => "M", "\x{43d}" => "H",
    "\x{43e}" => "O", "\x{43f}" => "N", "\x{44a}" => "b", "\x{44b}" => "bI",
    "\x{44c}" => "b", "\x{44d}" => "e", "\x{44e}" => "io", "\x{44f}" => "r",
    "\x{45a}" => "Hb", "\x{45b}" => "h", "\x{45c}" => "k", "\x{45d}" => "n",
    "\x{45e}" => "y", "\x{45f}" => "u", "\x{46a}" => "mY", "\x{46b}" => "my",
    "\x{46c}" => "Im", "\x{46d}" => "Im", "\x{46e}" => "3", "\x{46f}" => "3",
    "\x{47a}" => "O", "\x{47b}" => "o", "\x{47c}" => "W", "\x{47d}" => "w",
    "\x{47e}" => "W", "\x{47f}" => "W", "\x{48a}" => "H", "\x{48b}" => "H",
    "\x{48c}" => "B", "\x{48d}" => "b", "\x{48e}" => "P", "\x{48f}" => "p",
    "\x{49a}" => "K", "\x{49b}" => "k", "\x{49c}" => "K", "\x{49d}" => "k",
    "\x{49e}" => "K", "\x{49f}" => "k", "\x{4a0}" => "K", "\x{4a1}" => "k",
    "\x{4a2}" => "H", "\x{4a3}" => "h", "\x{4a4}" => "H", "\x{4a5}" => "h",
    "\x{4a6}" => "Ih", "\x{4a7}" => "ih", "\x{4a8}" => "O", "\x{4a9}" => "o",
    "\x{4aa}" => "C", "\x{4ab}" => "c", "\x{4ac}" => "T", "\x{4ad}" => "t",
    "\x{4ae}" => "Y", "\x{4af}" => "y", "\x{4b0}" => "Y", "\x{4b1}" => "y",
    "\x{4b2}" => "X", "\x{4b3}" => "x", "\x{4b4}" => "TI", "\x{4b5}" => "ti",
    "\x{4b6}" => "H", "\x{4b7}" => "h", "\x{4b8}" => "H", "\x{4b9}" => "h",
    "\x{4ba}" => "H", "\x{4bb}" => "h", "\x{4bc}" => "E", "\x{4bd}" => "e",
    "\x{4be}" => "E", "\x{4bf}" => "e", "\x{4c0}" => "I", "\x{4c1}" => "X",
    "\x{4c2}" => "x", "\x{4c3}" => "K", "\x{4c4}" => "k", "\x{4c5}" => "jt",
    "\x{4c6}" => "jt", "\x{4c7}" => "H", "\x{4c8}" => "h", "\x{4c9}" => "H",
    "\x{4ca}" => "h", "\x{4cb}" => "H", "\x{4cc}" => "h", "\x{4cd}" => "M",
    "\x{4ce}" => "m", "\x{4cf}" => "l", "\x{4d0}" => "A", "\x{4d1}" => "a",
    "\x{4d2}" => "A", "\x{4d3}" => "a", "\x{4d4}" => "AE", "\x{4d5}" => "ae",
    "\x{4d6}" => "E", "\x{4d7}" => "e", "\x{4d8}" => "e", "\x{4d9}" => "e",
    "\x{4da}" => "E", "\x{4db}" => "e", "\x{4dc}" => "X", "\x{4dd}" => "X",
    "\x{4de}" => "3", "\x{4df}" => "3", "\x{4e0}" => "3", "\x{4e1}" => "3",
    "\x{4e2}" => "N", "\x{4e3}" => "n", "\x{4e4}" => "N", "\x{4e5}" => "n",
    "\x{4e6}" => "O", "\x{4e7}" => "o", "\x{4e8}" => "O", "\x{4e9}" => "o",
    "\x{4ea}" => "O", "\x{4eb}" => "o", "\x{4ec}" => "E", "\x{4ed}" => "e",
    "\x{4ee}" => "Y", "\x{4ef}" => "y", "\x{4f0}" => "Y", "\x{4f1}" => "y",
    "\x{4f2}" => "Y", "\x{4f3}" => "y", "\x{4f4}" => "H", "\x{4f5}" => "h",
    "\x{4f6}" => "R", "\x{4f7}" => "r", "\x{4f8}" => "bI", "\x{4f9}" => "bi",
    "\x{4fa}" => "F", "\x{4fb}" => "f", "\x{4fc}" => "X", "\x{4fd}" => "x",
    "\x{4fe}" => "X", "\x{4ff}" => "x", "\x{50a}" => "H", "\x{50b}" => "h",
    "\x{50c}" => "G", "\x{50d}" => "g", "\x{50e}" => "T", "\x{50f}" => "t",
    "\x{51a}" => "Q", "\x{51b}" => "q", "\x{51c}" => "W", "\x{51d}" => "w",
    "\x{53a}" => "d", "\x{53b}" => "r", "\x{53c}" => "L", "\x{53d}" => "Iu",
    "\x{53e}" => "O", "\x{53f}" => "y", "\x{54a}" => "m", "\x{54b}" => "o",
    "\x{54c}" => "N", "\x{54d}" => "U", "\x{54e}" => "Y", "\x{54f}" => "S",
    "\x{56a}" => "d", "\x{56b}" => "h", "\x{56c}" => "l", "\x{56d}" => "lu",
    "\x{56e}" => "d", "\x{56f}" => "y", "\x{57a}" => "w", "\x{57b}" => "2",
    "\x{57c}" => "n", "\x{57d}" => "u", "\x{57e}" => "y", "\x{57f}" => "un"}

  @doc """
  Converts `string` to an ascii slug. Removes all unicode, spaces,
  extraneous dashes and punctuation and downcases the slug
  """
  @spec slugify(String.t) :: String.t
  def slugify(string) do
    for char <- String.codepoints(string) do @ucmap[char] || "" end
    |> Enum.join("")
    |> String.downcase
    |> String.replace(~r/-+/, "-")
    |> String.replace(~r/^-|-$/, "")
  end

  @doc """
  Converts `filename` to an ascii slug, as per slugify/1.
  This function retains the extension of the filename, only converting
  the basename.

  ## Example

        iex(1)> slugify_filename("test with spaces.jpeg")
        "test-with-spaces.jpeg"

  """
  def slugify_filename(filename) do
    {basename, ext} = split_filename(filename)
    slugged_filename = slugify(basename)
    "#{slugged_filename}#{ext}"
  end

  @doc """
  Generates a random basename for `filename`.
  Keeps the original extension.
  """
  def random_filename(filename) do
    ext = Path.extname(filename)
    rnd_basename =
      {filename, :erlang.now}
      |> :erlang.phash2
      |> Integer.to_string(32)
      |> String.downcase
    "#{rnd_basename}#{ext}"
  end

  @doc """
  Adds an unique postfix to `filename`
  """
  def unique_filename(filename) do
    ext = Path.extname(filename)
    base = String.replace(filename, ext, "")
    rnd_basename =
      {filename, :erlang.now}
      |> :erlang.phash2
      |> Integer.to_string(32)
      |> String.downcase
    "#{base}-#{rnd_basename}#{ext}"
  end

  @doc """
  Splits `file` (a path and filename).
  Return {`path`, `filename`}

  ## Example

      iex> split_path("test/dir/filename.jpg")
      {"test/dir", "filename.jpg"}
  """
  def split_path(file) do
    case String.contains?(file, "/") do
      true ->
        filename = Path.split(file) |> List.last
        path = Path.split(file)
        |> List.delete_at(-1)
        |> Path.join
        {path, filename}
      false ->
        {"", file}
    end
  end

  @doc """
  Splits `filename` into `basename` and `extension`
  Return {`basename`, `ext`}

  ## Example

      iex> split_filename("filename.jpg")
      {"filename", ".jpg"}
  """
  def split_filename(filename) do
    ext = Path.extname(filename)
    basename = Path.basename(filename, ext)
    {basename, ext}
  end

  @doc """
  Converts `coll` (if it's a struct) to a map with string keys
  """
  def to_string_map(nil), do: nil
  def to_string_map(coll) do
    case Map.has_key?(coll, :__struct__) do
      true ->
        Map.delete(coll, :__struct__)
        |> Enum.map(fn({k, v}) -> {Atom.to_string(k), v} end)
        |> Enum.into(%{})
      false -> coll
    end
  end

  @doc """
  Maybe implementation. If `arg1` is nil, do nothing.
  Else, invoke `fun` on `item`.
  """
  def maybe(nil, _fun), do: nil
  def maybe(item, fun), do: fun.(item)

  @doc """
  Converts an ecto datetime record to ISO 8601 format.
  """
  @spec to_iso8601(Ecto.DateTime.t) :: String.t
  def to_iso8601(dt) do
    list = [dt.year, dt.month, dt.day, dt.hour, dt.min, dt.sec]
    :io_lib.format("~4..0B-~2..0B-~2..0BT~2..0B:~2..0B:~2..0BZ", list)
    |> IO.iodata_to_binary
  end

  @doc """
  Compares the two binaries in constant-time to avoid timing attacks.
  See: http://codahale.com/a-lesson-in-timing-attacks/
  """
  def secure_compare(left, right) do
    if byte_size(left) == byte_size(right) do
      arithmetic_compare(left, right, 0) == 0
    else
      false
    end
  end

  defp arithmetic_compare(<<x, left :: binary>>, <<y, right :: binary>>, acc) do
    import Bitwise
    arithmetic_compare(left, right, acc ||| (x ^^^ y))
  end

  defp arithmetic_compare("", "", acc) do
    acc
  end

  @doc """
  Task.start `fun` unless we are testing, then just exec `fun`
  """
  defmacro task_start(fun) do
    if Mix.env == :test do
      quote do: unquote(fun).()
    else
      quote do: Task.start(unquote(fun))
    end
  end

  @doc """
  Assign `js` to `conn` as `:js_extra`.
  Is available as `conn.assigns[:js_extra]`, but is normally
  extracted through `<%= js_extra(@conn) %>` in `AdminView`.

  ## Example (in your controller)

        import Brando.Utils, only: [add_js: 2]
        conn |> add_js(["somescript.js", "anotherscript.js"])

  """
  def add_js(conn, js), do: conn |> assign(:js_extra, js)

  @doc """
  Assign `css` to `conn` as `:css_extra`.
  Is available as `conn.assigns[:css_extra]`, but is normally
  extracted through `<%= css_extra(@conn) %>` in `AdminView`.

  ## Example (in your controller)

        import Brando.Utils, only: [add_css: 2]
        conn |> add_css(["somescript.css", "anotherscript.css"])

  """
  def add_css(conn, css), do: conn |> assign(:css_extra, css)
end