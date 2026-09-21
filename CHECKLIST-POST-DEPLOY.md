# Checklist post-déploiement — Ma Revue de Presse

À cocher après le premier déploiement sur Coolify (`https://rvp.lemarre.online`).

## 0. Préparation

- [ ] Ressource PostgreSQL créée dans Coolify, `DATABASE_URL` renseignée
- [ ] `APP_PASSWORD_HASH` généré (Argon2id) et renseigné
- [ ] `SESSION_SECRET` généré (≥32 caractères aléatoires) et renseigné
- [ ] `LLM_API_KEY` / `LLM_MODEL` renseignés (+ `LLM_BASE_URL` si fournisseur non-OpenAI)
- [ ] `CRON_SECRET` généré et renseigné
- [ ] DNS `A rvp → IP VPS` configuré et propagé
- [ ] `npm run db:migrate` exécuté contre la base de production
- [ ] `npm run db:seed` exécuté (catégories initiales §13)

## 1. Authentification

- [ ] `https://rvp.lemarre.online` redirige vers `/login` (pas de session)
- [ ] Mauvais mot de passe → message d'erreur, pas d'accès
- [ ] 5 tentatives échouées → blocage temporaire (§11)
- [ ] Bon mot de passe → accès à `/`, session posée (cookie `rvp_session`, HttpOnly, Secure)
- [ ] Fermer/rouvrir le navigateur → session toujours valide (persist 30 j)
- [ ] `/settings` inaccessible sans session (redirige `/login`)
- [ ] `Se déconnecter` → invalide la session, redirige `/login`, plus d'accès à `/`

## 2. Sources

- [ ] `/settings` → ajouter une source Google News (ex. "Intelligence artificielle", catégorie IA)
- [ ] Source visible dans la liste avec "● actif"
- [ ] Ajouter une source RSS directe (ex. Numerama) → validation URL fonctionne
- [ ] Désactiver une source → passe à "inactif"
- [ ] Supprimer une source → disparaît de la liste

## 3. Collecte manuelle

- [ ] Sur `/`, cliquer `↻ Actualiser`
- [ ] Message "Actualisation en cours..." s'affiche
- [ ] Message final "X nouveaux articles" ou "Aucun nouvel article"
- [ ] **Les nouvelles cartes apparaissent sans recharger la page** (bug corrigé — à re-vérifier en conditions réelles)
- [ ] Relancer `↻ Actualiser` immédiatement → pas de doublons créés

## 4. Extraction et résumé

- [ ] Au moins un article passe en statut `ready` (visible en base ou via l'UI)
- [ ] Résumé en français, 3-5 lignes, factuel, sans invention
- [ ] Catégorie affichée cohérente avec la source ou le contenu
- [ ] Si contenu non extractible (paywall) → carte affiche "Résumé basé sur l'extrait disponible"
- [ ] Vérifier dans les logs qu'aucune erreur sur un article n'a bloqué les autres (§42)

## 5. Interface

- [ ] Carte entièrement cliquable → ouvre l'article original dans un nouvel onglet
- [ ] Filtrage par catégorie (onglets) fonctionne sans rechargement
- [ ] `Charger plus` charge la page suivante sans doublons
- [ ] Responsive : tester sur iPhone (1 colonne), tablette (2), desktop (3 max)
- [ ] Mode sombre suit la préférence système (basculer le thème OS et recharger)

## 6. Automatisation (cron)

- [ ] Tâche planifiée Coolify créée (`0 * * * *` → `POST /api/cron/collect` avec header `x-cron-secret`)
- [ ] Appel sans header ou mauvais secret → `401`
- [ ] Déclenchement manuel de la tâche planifiée → collecte s'exécute (vérifier logs)
- [ ] Attendre 1h en conditions réelles → nouveaux articles apparaissent automatiquement sans action utilisateur

## 7. Sécurité

- [ ] `.env` absent du dépôt Git (vérifié : `git log --all --full-history -- .env`)
- [ ] HTTPS actif, certificat valide, HTTP redirige vers HTTPS
- [ ] Aucun secret visible dans les logs applicatifs

## 8. Coûts / robustesse

- [ ] Recharger la page plusieurs fois → aucun nouvel appel LLM déclenché (résumé déjà en base, §44)
- [ ] Couper puis relancer le conteneur → l'application redémarre proprement, données conservées (Postgres externe)

---

Une fois toutes les cases cochées, le MVP est validé conformément au §54 du PRD.
