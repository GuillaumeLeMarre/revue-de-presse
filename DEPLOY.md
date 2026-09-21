# Déploiement (Coolify)

## 1. Ressources Coolify

- Créer une ressource **PostgreSQL** (managée par Coolify).
- Créer une ressource **application** à partir de ce dépôt Git, build type **Dockerfile**.

## 2. Variables d'environnement (application)

Copier depuis `.env.example` et renseigner dans Coolify :

```
APP_URL=https://rvp.lemarre.online
DATABASE_URL=<fourni par la ressource PostgreSQL Coolify>
APP_PASSWORD_HASH=<argon2id, généré avec: npx tsx -e "import a from 'argon2'; a.hash('motdepasse').then(console.log)">
SESSION_SECRET=<chaîne aléatoire ≥32 caractères, ex: openssl rand -base64 32>
LLM_API_KEY=
LLM_MODEL=
CRON_SECRET=<chaîne aléatoire, ex: openssl rand -hex 32>
```

## 3. Domaine

Coolify gère le reverse proxy, HTTPS, certificat TLS et la redirection HTTP → HTTPS.
Configurer un enregistrement DNS (§50) :

```
Type : A
Nom  : rvp
Valeur : <IP publique du VPS>
```

Puis attacher `rvp.lemarre.online` à l'application dans Coolify.

## 4. Migrations base de données

Avant le premier déploiement (ou après tout changement de schéma), exécuter depuis un terminal ayant accès à `DATABASE_URL` :

```
npm run db:migrate
```

Coolify permet de lancer cette commande via un "one-off command" sur le conteneur, ou depuis un poste avec accès réseau à la base.

Puis, une seule fois, initialiser les catégories (§13) :

```
npm run db:seed
```

## 5. Collecte automatique (cron)

L'application n'exécute pas elle-même de cron interne. Utiliser les **Scheduled Tasks** de Coolify pour appeler l'endpoint interne toutes les heures :

- Fréquence : `0 * * * *`
- Commande :

```
curl -f -X POST https://rvp.lemarre.online/api/cron/collect \
  -H "x-cron-secret: $CRON_SECRET"
```

L'endpoint refuse toute requête sans le bon `CRON_SECRET` (§52). Une collecte déjà en cours est ignorée (verrou en mémoire, §24/§51).

## 6. Vérification

- `https://rvp.lemarre.online` doit rediriger vers `/login` sans session.
- Après connexion, ajouter une source dans `/settings`, puis déclencher `↻ Actualiser`.
