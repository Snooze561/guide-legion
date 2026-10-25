# Guide Legion 7.3.5

Guide interactif pour la guilde : priorité des statistiques, équipement BiS, templates de talents et arme prodigieuse pour les 36 spés de World of Warcraft Legion 7.3.5, en PvE (raid Antorus et Mythique+).

## Ouvrir le site en local

Le site lit des fichiers JSON, il faut donc un petit serveur local :

```
python3 -m http.server
```

Puis ouvrir http://localhost:8000.

## Modifier une spé

Chaque spé a son fichier dans `data/specs/<classe>-<spe>.json` (par exemple `pretre-sacre.json`). La liste des classes et des spés est dans `data/classes.json`. Une spé sans fichier s'affiche comme « pas encore rédigée ».
