# ATM recommendation audit — v0.19.1

Reviewed 50 artist seeds across Closest Match, Broaden It and Wildcard. Each snapshot records the top 12 (1,800 result slots per version). Editorial review concentrated on the top five of each list; the full twelve received automated integrity checks. This is a targeted sample, not an exhaustive listening test or a measured accuracy benchmark.

## Findings and changes

- Corrected style families for 13 profiles: Dolly Parton, Ministry, Rammstein, HEALTH, Tinariwen, Björk, FKA twigs, Kate Bush, Stevie Wonder, James Brown, Curtis Mayfield, Brian Eno and Karlheinz Stockhausen. Brian Eno also gains an explicit ambient tag. Exact field changes are in PROFILE_CHANGES_v0.19.1.json.
- Normalised five family spelling variants at comparison time; stored artist identities stay intact.
- Primary style family now receives twice the weight of each secondary family. Added bounded affinities for art-pop, country, ska/reggae, desert blues, Arabic traditions and soul/funk. These are editorial relationships, not assertions that those styles are identical.
- Broaden It and Wildcard multiply their existing scores by a connection factor from 0.65 to 1. A candidate without tag/family overlap gets less priority; numerical-only discoveries remain possible. This reduces disconnected suggestions without a hard genre filter.
- Explanations no longer call numerical resemblance alone a useful cross-genre connection.
- No popularity boost, forced artist pairs, new artist additions, numeric trait changes, confidence upgrades or shared-profile penalties were introduced.

## Concrete outcomes

- HEALTH: Nine Inch Nails moves from fourth to first in Closest Match.
- Ministry: top five now lean toward industrial crossover rather than three straight thrash acts.
- Rammstein: Fear Factory and Rob Zombie enter the top five closest matches.
- Dolly Parton: top five Broaden It suggestions become country-rooted.
- Mdou Moctar: Tinariwen moves to first; Gustav Holst leaves the top twelve Broaden It suggestions.
- Justice: Stockhausen leaves the top twelve Wildcard suggestions after correcting his electro classification.
- Brian Eno: closest suggestions now include ambient artists Hiroshi Yoshimura, Midori Takada and Susumu Yokota.
- Her’s, Daft Punk, Nirvana and A Tribe Called Quest retain their five closest suggestions in the same order.

## Remaining judgement calls

The results are improved, not certified perfect. Broad legacy profiles still need work: The Beatles lean toward modern psych-pop; Stevie Wonder and James Brown still surface several generically described contemporary soul profiles; Darkthrone's atmospheric tag favours atmospheric/post-black acts. Fairuz and Umm Kulthum have a small local comparison pool, so orchestral/folk suggestions remain prominent. Wildcard can still make debatable jumps through broad tags. Artist eras and historical similar_to text were not refreshed in this pass; similar_to is not used by the ranking engine. These should be reviewed individually rather than fixed with fame boosts or a broad catalogue rewrite.

## Evidence and validation

Family corrections largely reconcile existing tags, atmosphere and notes. They are editorial classifications; musical-quality judgments are not independent verification or audio measurements. Dolly Parton's country/pop identity was also checked against [her official biography](https://www.dollyparton.com/). HEALTH's electronic/industrial crossover is consistent with [Pitchfork's Death Magic review](https://pitchfork.com/reviews/albums/20861-death-magic). Other searches were unhelpful and are not presented as supporting evidence. Existing confidence labels were preserved.

Node checks cover JavaScript syntax, all 150 recommendation lists, finite scores, twelve unique results, exclusion of the seed and disliked artists, reproducible snapshots, and targeted quality regressions. Run `node audit/check.cjs` from the release folder. This does not replace mobile/browser acceptance testing. Styling, navigation, assets, playlist URLs and the atm-mobile-v01 data key are preserved. Catalogue count remains 3,014.

## Top-five comparison for every seed and mode

### HEALTH

**Closest Match**

- Before: Pop. 1280, Daughters, Model/Actriz, Nine Inch Nails, Chat Pile
- After: Nine Inch Nails, Pop. 1280, Daughters, Model/Actriz, Chat Pile

**Broaden It**

- Before: Nine Inch Nails, Marilyn Manson, Crosses, Gesaffelstein, Chat Pile
- After: Nine Inch Nails, Marilyn Manson, Gesaffelstein, Bleached Cross, Chat Pile

**Wildcard**

- Before: Zeal & Ardor, Vessels, Maybeshewill, M|O|O|N, Melt-Banana
- After: Zeal & Ardor, Boris, The Cooper Temple Clause, Bo Ningen, The Locust

### Rammstein

**Closest Match**

- Before: Marilyn Manson, Powerman 5000, Spineshank, Nine Inch Nails, Cave In
- After: Powerman 5000, Spineshank, Marilyn Manson, Fear Factory, Rob Zombie

**Broaden It**

- Before: Nine Inch Nails, Cave In, Helmet, Marilyn Manson, Ministry
- After: Nine Inch Nails, Powerman 5000, Spineshank, Marilyn Manson, Fear Factory

**Wildcard**

- Before: Nine Inch Nails, HEALTH, Head Like a Hole, Evil Nine, The Cooper Temple Clause
- After: Fleshwater, HEALTH, Evil Nine, The Cooper Temple Clause, Coaltar of the Deepers

### Ministry

**Closest Match**

- Before: Marilyn Manson, Power Trip, Testament, Nine Inch Nails, Exodus
- After: Marilyn Manson, Nine Inch Nails, Code Orange, Rammstein, Spineshank

**Broaden It**

- Before: Nine Inch Nails, Street Sects, Power Trip, Testament, Exodus
- After: Nine Inch Nails, Code Orange, Marilyn Manson, Mick Gordon, HEALTH

**Wildcard**

- Before: Street Sects, Nine Inch Nails, HEALTH, Daughters, Prurient
- After: Daughters, HEALTH, Prurient, Giant Swan, Model/Actriz

### Her's

**Closest Match**

- Before: Beach Fossils, Alvvays, Craft Spells, Wild Nothing, Cindy Lee
- After: Beach Fossils, Alvvays, Craft Spells, Wild Nothing, Cindy Lee

**Broaden It**

- Before: Beach Fossils, Craft Spells, Wild Nothing, Cindy Lee, Alvvays
- After: Beach Fossils, Craft Spells, Wild Nothing, Cindy Lee, Alvvays

**Wildcard**

- Before: Mac DeMarco, CASTLEBEAT, The Cleaners from Venus, illuminati hotties, Wavves
- After: Mac DeMarco, CASTLEBEAT, The Cleaners from Venus, illuminati hotties, Wavves

### Nine Inch Nails

**Closest Match**

- Before: Marilyn Manson, HEALTH, Mindless Self Indulgence, Rammstein, Ministry
- After: HEALTH, Marilyn Manson, Mindless Self Indulgence, Rammstein, Ministry

**Broaden It**

- Before: HEALTH, Marilyn Manson, Mindless Self Indulgence, Ministry, Godflesh
- After: HEALTH, Marilyn Manson, Ministry, Mindless Self Indulgence, Rammstein

**Wildcard**

- Before: Killing Joke, American Head Charge, Adebisi Shank, Big Black, Frontierer
- After: Frontierer, Adebisi Shank, Muse, Backxwash, White Suns

### Deftones

**Closest Match**

- Before: Loathe, Coaltar of the Deepers, Taproot, Powerman 5000, MAXIMUM THE HORMONE
- After: Loathe, Coaltar of the Deepers, Taproot, Powerman 5000, MAXIMUM THE HORMONE

**Broaden It**

- Before: Coaltar of the Deepers, Loathe, Fleshwater, Staind, Taproot
- After: Coaltar of the Deepers, Loathe, Fleshwater, Staind, Taproot

**Wildcard**

- Before: Swervedriver, Hum, Glare, Kitchens of Distinction, Doves
- After: For Tracy Hyde, My Dead Girlfriend, Softcult, Yuragi, Kinoko Teikoku

### Metallica

**Closest Match**

- Before: Exodus, Anthrax, Venom, Power Trip, Testament
- After: Exodus, Anthrax, Venom, Power Trip, Testament

**Broaden It**

- Before: Anthrax, Alien Weaponry, Exodus, Power Trip, Testament
- After: Anthrax, Alien Weaponry, Exodus, Power Trip, Testament

**Wildcard**

- Before: Street Sects, Twisted Sister, Rainbow, Guns N' Roses, GWAR
- After: Street Sects, Twisted Sister, Rainbow, Guns N' Roses, GWAR

### Converge

**Closest Match**

- Before: Botch, Coalesce, The Chariot, Every Time I Die, Employed to Serve
- After: Botch, Coalesce, Every Time I Die, The Chariot, Employed to Serve

**Broaden It**

- Before: Employed to Serve, 156/Silence, Botch, Coalesce, Incendiary
- After: Employed to Serve, 156/Silence, Botch, Incendiary, Guilt Trip

**Wildcard**

- Before: Anxious, Big Black, Melt-Banana, Gorilla Biscuits, Petrol Girls
- After: Anxious, Big Black, Pest Control, Have Heart, Melt-Banana

### Darkthrone

**Closest Match**

- Before: Burzum, Deafheaven, Panopticon, Altar of Plagues, Leviathan
- After: Burzum, Deafheaven, Panopticon, Altar of Plagues, Leviathan

**Broaden It**

- Before: Burzum, Deafheaven, Panopticon, Leviathan, Altar of Plagues
- After: Burzum, Deafheaven, Panopticon, Leviathan, Altar of Plagues

**Wildcard**

- Before: Sugar Horse, Svalbard, Devil Sold His Soul, Chelsea Wolfe, Cancer Bats
- After: Sugar Horse, Svalbard, Devil Sold His Soul, Chelsea Wolfe, Cancer Bats

### Electric Wizard

**Closest Match**

- Before: Sleep, SUMAC, Sunn O))), Elder, Pallbearer
- After: Sleep, SUMAC, Sunn O))), Elder, Pallbearer

**Broaden It**

- Before: Sleep, SUMAC, Sunn O))), Elder, Pallbearer
- After: Sleep, SUMAC, Sunn O))), Elder, Pallbearer

**Wildcard**

- Before: High on Fire, Devil Sold His Soul, Civerous, Moonsorrow, Svalbard
- After: High on Fire, Devil Sold His Soul, Civerous, Moonsorrow, Svalbard

### Slowdive

**Closest Match**

- Before: Cocteau Twins, Wisp, Mojave 3, my bloody valentine, Duster
- After: Cocteau Twins, Wisp, Mojave 3, my bloody valentine, Duster

**Broaden It**

- Before: Cigarettes After Sex, Cocteau Twins, Wisp, Mojave 3, my bloody valentine
- After: Cigarettes After Sex, Cocteau Twins, Wisp, Mojave 3, my bloody valentine

**Wildcard**

- Before: Ethel Cain, Chappell Roan, Songs: Ohia, Sun Kil Moon, The Postal Service
- After: Ethel Cain, Chappell Roan, Songs: Ohia, Sun Kil Moon, The Postal Service

### Cocteau Twins

**Closest Match**

- Before: Mojave 3, my bloody valentine, Wisp, Slowdive, Duster
- After: Mojave 3, my bloody valentine, Wisp, Slowdive, Duster

**Broaden It**

- Before: Cigarettes After Sex, Mojave 3, my bloody valentine, Wisp, Slowdive
- After: Cigarettes After Sex, Mojave 3, my bloody valentine, Wisp, Slowdive

**Wildcard**

- Before: Ethel Cain, Songs: Ohia, Chappell Roan, Sun Kil Moon, Pizzicato Five
- After: Ethel Cain, Songs: Ohia, Chappell Roan, Sun Kil Moon, Pizzicato Five

### The Cure

**Closest Match**

- Before: Joy Division, Siouxsie and the Banshees, Public Image Ltd, Drab Majesty, Comsat Angels
- After: Joy Division, Siouxsie and the Banshees, Public Image Ltd, Drab Majesty, Comsat Angels

**Broaden It**

- Before: Public Image Ltd, Drab Majesty, Joy Division, Siouxsie and the Banshees, New Order
- After: Public Image Ltd, Drab Majesty, Joy Division, Siouxsie and the Banshees, New Order

**Wildcard**

- Before: Kim Carnes, Tesla Boy, Gary Numan, The Drums, Wipers
- After: Kim Carnes, Tesla Boy, Gary Numan, The Drums, Wipers

### Radiohead

**Closest Match**

- Before: Muse, These New Puritans, The Residents, PJ Harvey, David Bowie
- After: These New Puritans, The Residents, Muse, PJ Harvey, David Bowie

**Broaden It**

- Before: The Residents, These New Puritans, PJ Harvey, David Bowie, Muse
- After: These New Puritans, The Residents, PJ Harvey, David Bowie, Robert Fripp

**Wildcard**

- Before: Mossy Rock Garden, Silver Apples, St. Vincent, Nico, Kim Gordon
- After: Tropical Fuck Storm, Kim Gordon, Silver Apples, Tool, Ween

### Nirvana

**Closest Match**

- Before: Pearl Jam, Soundgarden, The Smashing Pumpkins, Alice in Chains, Hole
- After: Pearl Jam, Soundgarden, The Smashing Pumpkins, Alice in Chains, Hole

**Broaden It**

- Before: Alice in Chains, Pearl Jam, Soundgarden, The Smashing Pumpkins, Silverchair
- After: Alice in Chains, Pearl Jam, Soundgarden, The Smashing Pumpkins, Silverchair

**Wildcard**

- Before: Mrs. GREEN APPLE, Motörhead, Dio, Ghost, Diamond Head
- After: Mrs. GREEN APPLE, Motörhead, Dio, Ghost, Diamond Head

### The Beatles

**Closest Match**

- Before: Djo, Of Montreal, Lô Borges, Curio Curio, The Beach Boys
- After: Djo, Of Montreal, Lô Borges, Curio Curio, The Beach Boys

**Broaden It**

- Before: Lô Borges, Curio Curio, Djo, Of Montreal, Love
- After: Lô Borges, Curio Curio, Djo, Of Montreal, Love

**Wildcard**

- Before: Ride, Zombi, Spacemen 3, Can, Ween
- After: Ride, Zombi, Spacemen 3, Can, Ween

### Fleetwood Mac

**Closest Match**

- Before: 10cc, Steely Dan, Steeleye Span, Mac DeMarco, Eagles
- After: 10cc, Steely Dan, Steeleye Span, Mac DeMarco, Eagles

**Broaden It**

- Before: Steely Dan, Steeleye Span, 10cc, Steve Earle, Richard Thompson
- After: Steely Dan, Steeleye Span, 10cc, Steve Earle, Richard Thompson

**Wildcard**

- Before: Crosby, Stills, Nash & Young, Wings, Linda McCartney, Paul McCartney, Cat Stevens
- After: Crosby, Stills, Nash & Young, Wings, Linda McCartney, Paul McCartney, Cat Stevens

### Joni Mitchell

**Closest Match**

- Before: Bob Dylan, Donovan, Neil Young, Leonard Cohen, Paul Kelly
- After: Bob Dylan, Donovan, Neil Young, Leonard Cohen, Paul Kelly

**Broaden It**

- Before: Bob Dylan, Donovan, The Waterboys, Gravenhurst, Willie Nelson
- After: Bob Dylan, Donovan, The Waterboys, Gravenhurst, Willie Nelson

**Wildcard**

- Before: The Byrds, Taylor Swift, Jefferson Airplane, Love, The Band
- After: The Byrds, Taylor Swift, Jefferson Airplane, Love, The Band

### Dolly Parton

**Closest Match**

- Before: Charley Pride, Don Williams, The Highwomen, John Denver, Tammy Wynette
- After: Charley Pride, The Highwomen, Tammy Wynette, Don Williams, Glen Campbell

**Broaden It**

- Before: The Beautiful South, Carly Rae Jepsen, Neneh Cherry, Don Williams, Ed Sheeran
- After: Charley Pride, The Highwomen, Don Williams, Glen Campbell, Roger Miller

**Wildcard**

- Before: Amy Grant, Ed Sheeran, The Mynabirds, Taylor Swift, Lewis Capaldi
- After: Benson Boone, Feist, George Harrison, Natalia Lafourcade, Donny Hathaway

### Taylor Swift

**Closest Match**

- Before: Benson Boone, Ed Sheeran, Lewis Capaldi, Sia, Sezen Aksu
- After: Benson Boone, Ed Sheeran, Lewis Capaldi, Sezen Aksu, Rosanne Cash

**Broaden It**

- Before: Tim McGraw, Sezen Aksu, Marty Robbins, Rosanne Cash, Benson Boone
- After: Rosanne Cash, Sezen Aksu, Mary Chapin Carpenter, Marty Robbins, Benson Boone

**Wildcard**

- Before: Justin Townes Earle, PJ Harvey, Jason Isbell, George Harrison, Rodney Crowell
- After: Kenny Rogers, LeAnn Rimes, Keith Urban, Garth Brooks, Shania Twain

### Kesha

**Closest Match**

- Before: Katy Perry, TOMORROW X TOGETHER, Sia, Britney Spears, SEVENTEEN
- After: Sia, Britney Spears, Katy Perry, TOMORROW X TOGETHER, Sabrina Carpenter

**Broaden It**

- Before: SEVENTEEN, Britney Spears, TOMORROW X TOGETHER, Katy Perry, The Black Eyed Peas
- After: Britney Spears, SEVENTEEN, Sia, Popcaan, Burna Boy

**Wildcard**

- Before: Shakira, Popcaan, Burna Boy, Major Lazer, Madeon
- After: Ofra Haza, A. R. Rahman, The Chainsmokers, Burna Boy, Popcaan

### Beyoncé

**Closest Match**

- Before: Janet Jackson, Ariana Grande, Rina Sawayama, Rihanna, Destiny's Child
- After: Janet Jackson, Ariana Grande, Rihanna, Destiny's Child, Usher

**Broaden It**

- Before: Rihanna, Destiny's Child, Janet Jackson, Usher, Ariana Grande
- After: Rihanna, Destiny's Child, Janet Jackson, Usher, Ariana Grande

**Wildcard**

- Before: En Vogue, U.S. Girls, Mary J. Blige, Mk.gee, NxWorries
- After: Miguel, Mk.gee, Missy Elliott, Jeremih, Lauryn Hill

### Stevie Wonder

**Closest Match**

- Before: The Mohawks, Thea Van Seijen, The Motet & Nigel Hall, Joel Culpepper, Judith Hill
- After: James Brown, The Isley Brothers, The Mohawks, Thea Van Seijen, The Motet & Nigel Hall

**Broaden It**

- Before: Joel Culpepper, The Mohawks, Thea Van Seijen, The Motet & Nigel Hall, Judith Hill
- After: The Mohawks, Thea Van Seijen, Joel Culpepper, The Motet & Nigel Hall, Judith Hill

**Wildcard**

- Before: Tim Maia, Joan Armatrading, Sparkee, Mark Ronson, Naoya Matsuoka
- After: Makoto Matsushita, Tyla, Masayoshi Takanaka, T-Square, Anri

### James Brown

**Closest Match**

- Before: The Motet & Nigel Hall, Judith Hill, Thea Van Seijen, Joel Culpepper, The Mohawks
- After: Stevie Wonder, The Motet & Nigel Hall, Judith Hill, Thea Van Seijen, Joel Culpepper

**Broaden It**

- Before: Judith Hill, The Motet & Nigel Hall, Thea Van Seijen, Joel Culpepper, The Mohawks
- After: Stevie Wonder, Ohio Players, Judith Hill, The Motet & Nigel Hall, Thea Van Seijen

**Wildcard**

- Before: Manu Dibango, Sparkee, Ebo Taylor, Tim Maia, Mark Ronson
- After: Tetsuo Sakurai, Tyla, Hiromasa Suzuki, Casiopea, Masato Honda

### Chic

**Closest Match**

- Before: Commodores, Ohio Players, Kool & The Gang, Zapp, Jungle
- After: Commodores, Ohio Players, Kool & The Gang, Zapp, Jungle

**Broaden It**

- Before: Commodores, Ohio Players, Evelyn “Champagne” King, Kool & The Gang, Jungle
- After: Commodores, Ohio Players, Evelyn “Champagne” King, Kool & The Gang, Jungle

**Wildcard**

- Before: Childish Gambino, Whitney Houston, Casiopea, George Michael, Naoya Matsuoka
- After: Childish Gambino, Inner City, Naoya Matsuoka, George Michael, Marcos Valle

### Daft Punk

**Closest Match**

- Before: DJ Falcon, Étienne de Crécy, Stardust, Cassius, SebastiAn
- After: DJ Falcon, Étienne de Crécy, Stardust, Cassius, SebastiAn

**Broaden It**

- Before: DJ Falcon, Étienne de Crécy, Stardust, Cassius, SebastiAn
- After: DJ Falcon, Étienne de Crécy, Stardust, Cassius, SebastiAn

**Wildcard**

- Before: Romy, Robyn, Kylie Minogue, Empire Of The Sun, Flo Rida
- After: Romy, Flo Rida, Robyn, Mystery Skulls, Caribou

### Justice

**Closest Match**

- Before: Oliver, SebastiAn, Busy P, Surkin, Kavinsky
- After: Oliver, SebastiAn, Busy P, Surkin, Kavinsky

**Broaden It**

- Before: Oliver, SebastiAn, Busy P, Kavinsky, Surkin
- After: Oliver, Busy P, SebastiAn, Kavinsky, Surkin

**Wildcard**

- Before: Robyn, Don Omar, Romy, Mystery Skulls, Karlheinz Stockhausen
- After: Robyn, Don Omar, Romy, Mystery Skulls, Flo Rida

### Aphex Twin

**Closest Match**

- Before: The Black Dog, The Future Sound of London, Luke Slater, Plaid, Global Communication
- After: The Black Dog, The Future Sound of London, Luke Slater, µ-Ziq, Plaid

**Broaden It**

- Before: The Black Dog, The Future Sound of London, Luke Slater, Global Communication, Laurel Halo
- After: The Black Dog, The Future Sound of London, Luke Slater, Global Communication, Laurel Halo

**Wildcard**

- Before: 65daysofstatic, Sweet Trip, Matmos, The Log.Os, Africa Hitech
- After: 65daysofstatic, Dan Deacon, Sweet Trip, Black Dresses, Lucrecia Dalt

### Brian Eno

**Closest Match**

- Before: Los Thuthanaka, Pauline Oliveros, Alvin Lucier, Hiroshi Yoshimura, Suzanne Ciani
- After: Mossy Rock Garden, Hiroshi Yoshimura, Luke Abbott, Midori Takada, Susumu Yokota

**Broaden It**

- Before: Los Thuthanaka, Pauline Oliveros, Hiroshi Yoshimura, Laurie Anderson, Björk
- After: Hiroshi Yoshimura, Mossy Rock Garden, Luke Abbott, Nils Frahm, Midori Takada

**Wildcard**

- Before: Karlheinz Stockhausen, Dan Deacon, Julius Eastman, The Bad Dreamers, Gideon Smith & The Dixie Damned
- After: Sudan Archives, Black Dresses, Lucrecia Dalt, Fire-Toolz, Björk

### Burial

**Closest Match**

- Before: Boards Of Canada, Iglooghost, GAS, Oneohtrix Point Never, Overmono
- After: Boards Of Canada, Iglooghost, GAS, Oneohtrix Point Never, Overmono

**Broaden It**

- Before: Boards Of Canada, GAS, Oneohtrix Point Never, Iglooghost, Overmono
- After: Boards Of Canada, GAS, Oneohtrix Point Never, Iglooghost, Overmono

**Wildcard**

- Before: Everything but the Girl, Ólafur Arnalds, Jóhann Jóhannsson, Bark Psychosis, Ben Howard
- After: Everything but the Girl, Ólafur Arnalds, Jóhann Jóhannsson, Bark Psychosis, Ben Howard

### Goldie

**Closest Match**

- Before: Photek, Calibre, LTJ Bukem, Dillinja, Roni Size
- After: Photek, Calibre, LTJ Bukem, Dillinja, Roni Size

**Broaden It**

- Before: Photek, Calibre, LTJ Bukem, Dillinja, KMRU
- After: Photek, Calibre, LTJ Bukem, Dillinja, KMRU

**Wildcard**

- Before: Slauson Malone, Mossy Rock Garden, Carter Tutti Void, Matmos, Ólafur Arnalds
- After: Slauson Malone, Matmos, Mossy Rock Garden, Carter Tutti Void, Sweet Trip

### Kraftwerk

**Closest Match**

- Before: Giorgio Moroder, Karl Bartos, Telex, Wolfgang Flür, Yellow Magic Orchestra
- After: Giorgio Moroder, Karl Bartos, Telex, Wolfgang Flür, Yellow Magic Orchestra

**Broaden It**

- Before: Giorgio Moroder, Karl Bartos, Telex, Robyn, Wolfgang Flür
- After: Karl Bartos, Giorgio Moroder, Telex, Wolfgang Flür, Robyn

**Wildcard**

- Before: Empire Of The Sun, iamamiwhoami, Yazoo, Diamond Rings, Blancmange
- After: Nourished by Time, Bronski Beat, Heaven 17, The Postal Service, Duran Duran

### Kendrick Lamar

**Closest Match**

- Before: Lupe Fiasco, Blu, McKinley Dixon, Noname, Little Simz
- After: Lupe Fiasco, Little Simz, Blu, McKinley Dixon, Noname

**Broaden It**

- Before: Little Simz, Lupe Fiasco, Blu, McKinley Dixon, Noname
- After: Little Simz, Lupe Fiasco, Blu, McKinley Dixon, Noname

**Wildcard**

- Before: Gorillaz, Teflon Tel Aviv, Talib Kweli, Open Mike Eagle, Hobo Johnson
- After: Marquis Hill, Little Brother, Souls of Mischief, Black Star, Common

### A Tribe Called Quest

**Closest Match**

- Before: Digable Planets, De La Soul, YC the Cynic, Gang Starr, The Roots
- After: Digable Planets, De La Soul, YC the Cynic, Gang Starr, The Roots

**Broaden It**

- Before: Digable Planets, De La Soul, Mos Def, Gang Starr, The Roots
- After: Digable Planets, De La Soul, Mos Def, Gang Starr, The Roots

**Wildcard**

- Before: Gorillaz, Hot Mustard, Bad Bunny, J Balvin, Karol G
- After: Gorillaz, Bad Bunny, J Balvin, Karol G, Tainy

### Stormzy

**Closest Match**

- Before: Dizzee Rascal, Kano, Ghetts, Skepta, slowthai
- After: Dizzee Rascal, Kano, Ghetts, Skepta, slowthai

**Broaden It**

- Before: Kano, Dizzee Rascal, Ghetts, Damian Marley, Skepta
- After: Kano, Dizzee Rascal, Ghetts, Damian Marley, KRS-One

**Wildcard**

- Before: Damian Marley, Coki, NCT DREAM, JENNIE, Jay Chou
- After: Damian Marley, Protoje, Kirk Franklin, Nightmares on Wax, Wiley

### Bob Marley & The Wailers

**Closest Match**

- Before: The Wailers, Peter Tosh, Bunny Wailer, Lee "Scratch" Perry, Burning Spear
- After: The Wailers, Peter Tosh, Bunny Wailer, Lee "Scratch" Perry, Burning Spear

**Broaden It**

- Before: Burning Spear, Lee "Scratch" Perry, The Wailers, Peter Tosh, Bunny Wailer
- After: Burning Spear, Lee "Scratch" Perry, The Wailers, Peter Tosh, Bunny Wailer

**Wildcard**

- Before: DeepChord, Horsepower Productions, Pinch, Basic Channel, The Police
- After: DeepChord, Horsepower Productions, Pinch, Basic Channel, The Police

### The Specials

**Closest Match**

- Before: Madness, Th' Dudes, The Sound, No Doubt, The Jam
- After: Madness, Th' Dudes, Sizzla, Damian Marley, The Skatalites

**Broaden It**

- Before: Madness, Th' Dudes, No Doubt, The Futureheads, The Sound
- After: Madness, Damian Marley, Sizzla, Capleton, Steel Pulse

**Wildcard**

- Before: The Futureheads, The Sound, No Doubt, Th' Dudes, The Jam
- After: No Doubt, Th' Dudes, Steel Pulse, The Futureheads, The Skatalites

### Miles Davis

**Closest Match**

- Before: Wayne Shorter, Herbie Hancock, John Coltrane, Ryo Fukui, Kamasi Washington
- After: Wayne Shorter, Herbie Hancock, John Coltrane, Ryo Fukui, McCoy Tyner

**Broaden It**

- Before: Herbie Hancock, Kamasi Washington, Wayne Shorter, The Dave Brubeck Quartet, Ryo Fukui
- After: Herbie Hancock, Wayne Shorter, Ryo Fukui, The Dave Brubeck Quartet, John Coltrane

**Wildcard**

- Before: Makoto Matsushita, Keith Jarrett, corto.alto, Art Blakey, Art Blakey & The Jazz Messengers
- After: Kohsuke Mine, Stan Getz, Eric Dolphy, Bessie Smith, Tsuyoshi Yamamoto Trio

### John Coltrane

**Closest Match**

- Before: Pharoah Sanders, Alice Coltrane, Yusef Lateef, Kohsuke Mine, Sun Ra
- After: Pharoah Sanders, Alice Coltrane, Kohsuke Mine, Sun Ra, Fumio Itabashi

**Broaden It**

- Before: Pharoah Sanders, Alice Coltrane, Kohsuke Mine, Abdullah Ibrahim, Yusef Lateef
- After: Pharoah Sanders, Kohsuke Mine, Alice Coltrane, Abdullah Ibrahim, Fumio Itabashi

**Wildcard**

- Before: Derek Bailey, Spontaneous Music Ensemble, Ahmad Jamal, Toshiko Akiyoshi, Dizzy Gillespie
- After: Derek Bailey, Spontaneous Music Ensemble, Gato Barbieri, Charles Mingus, Archie Shepp

### Carmen McRae

**Closest Match**

- Before: Anita O'Day, Mel Tormé, Samara Joy, Betty Carter, Blossom Dearie
- After: Anita O'Day, Mel Tormé, Samara Joy, Blossom Dearie, Betty Carter

**Broaden It**

- Before: Mel Tormé, Anita O'Day, Samara Joy, Blossom Dearie, Dianne Reeves
- After: Mel Tormé, Anita O'Day, Samara Joy, Blossom Dearie, Dianne Reeves

**Wildcard**

- Before: Frank Sinatra, Pentangle, Irma Thomas, Louis Jordan, Jordan Rakei
- After: Pentangle, Frank Sinatra, Lyle Lovett, Bilal, Tito Puente

### Fela Kuti

**Closest Match**

- Before: Fela Kuti & Afrika 70, Tony Allen, The Souljazz Orchestra, Ebo Taylor, Marcos Valle
- After: Tony Allen, Fela Kuti & Afrika 70, Ebo Taylor, The Souljazz Orchestra, Ibibio Sound Machine

**Broaden It**

- Before: The Souljazz Orchestra, Fela Kuti & Afrika 70, Roy Ayers, Tony Allen, Ebo Taylor
- After: The Souljazz Orchestra, Fela Kuti & Afrika 70, Tony Allen, Ebo Taylor, Roy Ayers

**Wildcard**

- Before: Hiromasa Suzuki, Tetsuo Sakurai, Native Son, The Players, Akira Jimbo
- After: Mulatu Astatke, Thundercat, Naoya Matsuoka, Roy Ayers, Average White Band

### Tony Allen

**Closest Match**

- Before: Fela Kuti, Ebo Taylor, Manu Dibango, Mulatu Astatke, The Souljazz Orchestra
- After: Fela Kuti, Ebo Taylor, The Souljazz Orchestra, Hugh Masekela, Manu Dibango

**Broaden It**

- Before: Hugh Masekela, Ebo Taylor, Manu Dibango, Hiromasa Suzuki, Casiopea
- After: Hugh Masekela, Ebo Taylor, Manu Dibango, The Souljazz Orchestra, Fela Kuti

**Wildcard**

- Before: Thundercat, Naoya Matsuoka & Wesing, Fletcher Henderson, Akira Ishikawa & Count Buffalos, Jiro Inagaki & Soul Media
- After: Ezra Collective, Ryo Kawasaki, Jiro Inagaki & Soul Media, Masato Honda, Casiopea

### Mdou Moctar

**Closest Match**

- Before: Erkin Koray, Tinariwen, Barış Manço, Yura Yura Teikoku, Selda Bağcan
- After: Tinariwen, Erkin Koray, Barış Manço, Yura Yura Teikoku, Amadou & Mariam

**Broaden It**

- Before: Yura Yura Teikoku, Erkin Koray, Barış Manço, Selda Bağcan, Gustav Holst
- After: Tinariwen, Earl Hooker, Magic Sam, Luther Allison, T-Model Ford

**Wildcard**

- Before: Yura Yura Teikoku, Selda Bağcan, Gustav Holst, Barış Manço, Tall Ships
- After: Earl Hooker, Magic Sam, Luther Allison, T-Model Ford, Gary Clark Jr.

### Anoushka Shankar

**Closest Match**

- Before: Zakir Hussain, Ali Akbar Khan, Ravi Shankar, Dhafer Youssef, Rabih Abou-Khalil
- After: Zakir Hussain, Ali Akbar Khan, Ravi Shankar, Lata Mangeshkar, Dhafer Youssef

**Broaden It**

- Before: Ali Akbar Khan, Zakir Hussain, Dhafer Youssef, Rabih Abou-Khalil, Marquis Hill
- After: Ali Akbar Khan, Zakir Hussain, Lata Mangeshkar, Ravi Shankar, Dhafer Youssef

**Wildcard**

- Before: Dhafer Youssef, Rabih Abou-Khalil, Marquis Hill, Kurt Elling, Cécile McLorin Salvant
- After: Lata Mangeshkar, Ravi Shankar, Dhafer Youssef, Rabih Abou-Khalil, Dead Can Dance

### Umm Kulthum

**Closest Match**

- Before: Fairuz, Rahim AlHaj, Nino Rota, Ali Akbar Khan, Jean Sibelius
- After: Fairuz, Rabih Abou-Khalil, Rahim AlHaj, Natacha Atlas, Nino Rota

**Broaden It**

- Before: Fairuz, Nino Rota, Rabih Abou-Khalil, Jean Sibelius, Pentangle
- After: Fairuz, Rabih Abou-Khalil, Natacha Atlas, Nino Rota, Jean Sibelius

**Wildcard**

- Before: Nino Rota, Rabih Abou-Khalil, Jean Sibelius, Pentangle, Nobuo Uematsu
- After: Rabih Abou-Khalil, Natacha Atlas, Nino Rota, Jean Sibelius, Nobuo Uematsu

### Fairuz

**Closest Match**

- Before: Umm Kulthum, Natacha Atlas, Nino Rota, Oliver Mtukudzi, Bonga
- After: Umm Kulthum, Natacha Atlas, Nino Rota, Oliver Mtukudzi, Bonga

**Broaden It**

- Before: Nino Rota, Sandy Denny, Kate & Anna McGarrigle, Suzanne Vega, Phil Ochs
- After: Umm Kulthum, Natacha Atlas, Nino Rota, Sandy Denny, Kate & Anna McGarrigle

**Wildcard**

- Before: Sandy Denny, Kate & Anna McGarrigle, Nino Rota, Suzanne Vega, Phil Ochs
- After: Nino Rota, Sandy Denny, Kate & Anna McGarrigle, Suzanne Vega, Phil Ochs

### Ryuichi Sakamoto

**Closest Match**

- Before: Manuel Göttsching, Jóhann Jóhannsson, Ólafur Arnalds, Nils Frahm, Max Richter
- After: Manuel Göttsching, Jóhann Jóhannsson, Ólafur Arnalds, Nils Frahm, Max Richter

**Broaden It**

- Before: Manuel Göttsching, Nils Frahm, Ólafur Arnalds, Jóhann Jóhannsson, Photek
- After: Manuel Göttsching, Nils Frahm, Photek, Calibre, Ólafur Arnalds

**Wildcard**

- Before: Slauson Malone, Karlheinz Stockhausen, Natacha Atlas, Igor Stravinsky, These New Puritans
- After: Slauson Malone, Sweet Trip, Carter Tutti Void, Mossy Rock Garden, 65daysofstatic

### Björk

**Closest Match**

- Before: Brian Eno, Alice Longyu Gao, Dorian Electra, Los Thuthanaka, underscores
- After: Kirin J Callinan, FKA twigs, Destroyer, Empress Of, Holly Herndon

**Broaden It**

- Before: Brian Eno, Karlheinz Stockhausen, Los Thuthanaka, Tom Zé, Pauline Oliveros
- After: FKA twigs, Kirin J Callinan, Jockstrap, U.S. Girls, Parenthetical Girls

**Wildcard**

- Before: Kirin J Callinan, Skream, Christian Marclay, Rudeboyz, John Cage
- After: Panda Bear, Tom Zé, Parenthetical Girls, Brian Eno, U.S. Girls

### Gustav Holst

**Closest Match**

- Before: Sergei Prokofiev, Jean Sibelius, John Williams, Sergei Rachmaninoff, Nino Rota
- After: Sergei Prokofiev, Jean Sibelius, Sergei Rachmaninoff, John Williams, Nino Rota

**Broaden It**

- Before: Sergei Prokofiev, Jean Sibelius, John Williams, Sergei Rachmaninoff, Nino Rota
- After: Sergei Prokofiev, Jean Sibelius, Sergei Rachmaninoff, John Williams, Nino Rota

**Wildcard**

- Before: Sergei Rachmaninoff, Mdou Moctar, Selda Bağcan, Joe Satriani, Umm Kulthum
- After: Ennio Morricone, Erik Satie, Bernard Herrmann, Joe Hisaishi, Sergei Rachmaninoff

### Nobuo Uematsu

**Closest Match**

- Before: Koji Kondo, Nino Rota, John Williams, Joe Hisaishi, Ennio Morricone
- After: Koji Kondo, Nino Rota, John Williams, Joe Hisaishi, Ennio Morricone

**Broaden It**

- Before: Nino Rota, John Williams, Koji Kondo, Barış Manço, A. R. Rahman
- After: Nino Rota, John Williams, Koji Kondo, A. R. Rahman, Joe Hisaishi

**Wildcard**

- Before: Barış Manço, A. R. Rahman, Natacha Atlas, Erykah Badu, Faye Wong
- After: A. R. Rahman, Vangelis, Ennio Morricone, Power Glove, Susumu Hirasawa

