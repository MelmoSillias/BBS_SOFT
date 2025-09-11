<?php

namespace App\Controller;

use App\Entity\AccountTransaction;
use App\Entity\Agence;
use App\Entity\Approvisionnement;
use App\Entity\Depense;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class DepenseController extends AbstractController
{
    #[Route('/dashboard/depense', name: 'app_depense')]
    public function index(EntityManagerInterface $em): Response
    {
        return $this->render('depense/index.html.twig', [
            'controller_name' => 'DepenseController',
        ]);
    }

    #[Route('/api/depense/create', name: 'api_depense_create', methods: ['POST'])]
    public function createDepense(EntityManagerInterface $em, Request $req): JsonResponse
    {
        // Récupérer les données du corps de la requête
        $data = json_decode($req->getContent(), true);
 
        // Vérifier si les données sont valides
        if (empty($data)) {
            return new JsonResponse(['error' => 'Erreur de données'], 400);
        }

        // Créer une nouvelle instance de Depense
        $depense = new Depense();

        // Définir les propriétés de l'entité Depense
        $depense->setDate(new \DateTimeImmutable($data['date']));
        $depense->setMotif($data['motif']);
        $depense->setType($data['type']);
        $depense->setMontant($data['montant']);
        $depense->setNote($data['notes'] ?? '');

        // Associer l'utilisateur connecté
        $user = $this->getUser();
        if ($user) {
            $depense->setUser($user);
        }

        // Créer la transaction comptable
        $agence = $em->getRepository(Agence::class)->findOneBy(['id' => 1]); // Agence locale
        $transaction = new AccountTransaction();
        $transaction->setCFA(-$data['montant']) // Montant négatif pour une dépense
                    ->setDescrib('Dépense: ' . $data['motif'])
                    ->setAgence($agence)
                    ->setCreatedAt(new \DateTimeImmutable($data['date']));

        // Associer la transaction à la dépense
        $depense->setTransaction($transaction); 

        // Persister et sauvegarder les entités
        $em->persist($depense);
        $em->persist($transaction);
        $em->flush();

        // Retourner une réponse JSON
        return new JsonResponse(['success' => true, 'depenseId' => $depense->getId()]);
    }

    #[Route('/api/depenses', name: 'api_depense_list', methods: ['GET'])]
    public function listDepenses(EntityManagerInterface $em, Request $req): JsonResponse
    {
        // Récupérer les paramètres de la requête
        $startDate = $req->query->get('dateFrom');
        $endDate = $req->query->get('dateTo');
        $type = $req->query->get('type'); 

        // Créer une requête de base
        $queryBuilder = $em->getRepository(Depense::class)->createQueryBuilder('d');

        // Appliquer les filtres
        if ($startDate && $endDate) {
            $queryBuilder->andWhere('d.date BETWEEN :start AND :end')
                ->setParameter('start', new \DateTime($startDate))
                ->setParameter('end', new \DateTime($endDate));
        }

        if ($type) {
            $queryBuilder->andWhere('d.type = :type')
                ->setParameter('type', $type);
        } 

        // Ordonner par date décroissante
        $queryBuilder->orderBy('d.date', 'DESC');

        // Récupérer les résultats
        $depenses = $queryBuilder->getQuery()->getResult();

        // Préparer les données de sortie
        $output = array_map(function ($depense) {
            return [
                'id' => $depense->getId(),
                'date' => $depense->getDate()->format('Y-m-d'),
                'motif' => $depense->getMotif(),
                'type' => $depense->getType(), 
                'montant' => $depense->getMontant(), 
                'notes' => $depense->getNote(),
                'utilisateur' => $depense->getUser() ? $depense->getUser()->getUsername() : 'Système'
            ];
        }, $depenses);

        return new JsonResponse($output);
    }

    #[Route('/api/depenses/stats', name: 'api_depense_stats', methods: ['GET'])]
    public function statsDepenses(EntityManagerInterface $em, Request $req): JsonResponse
    {
        // Récupération des dates (optionnelles)
        $startDate = $req->query->get('dateFrom');
        $endDate = $req->query->get('dateTo');
        $type = $req->query->get('type');

        $qb = $em->getRepository(Depense::class)->createQueryBuilder('d');

        // Filtre par période
        if ($startDate && $endDate) {
            $qb->andWhere('d.date BETWEEN :start AND :end')
                ->setParameter('start', new \DateTime($startDate))
                ->setParameter('end', new \DateTime($endDate));
        }

        // Filtre par type
        if ($type) {
            $qb->andWhere('d.type = :type')
                ->setParameter('type', $type);
        }

        $depenses = $qb->getQuery()->getResult();

        // Initialisation des stats
        $totalDepenses = count($depenses);
        $totalMontant = 0;

        $parCategorie = [];

        foreach ($depenses as $depense) {
            $totalMontant += $depense->getMontant();

            // Par catégorie
            $categorie = $depense->gettype();
            if (!isset($parCategorie[$categorie])) {
                $parCategorie[$categorie] = $depense->getMontant();
            } else {
                $parCategorie[$categorie] += $depense->getMontant();
            }
        }

        $stats = [
            'periode' => $startDate && $endDate ? [
                'du' => $startDate,
                'au' => $endDate,
            ] : 'Toutes périodes',
            'nombre_total' => $totalDepenses,
            'montant_total' => $totalMontant, 
            'par_categorie' => $parCategorie,
        ];

        return new JsonResponse($stats);
    }

    #[Route('/api/depenses/{id}', name: 'api_depense_details', methods: ['GET'])]
    public function detailsDepense(Depense $depense, EntityManagerInterface $em, Request $req): JsonResponse
    {
        if (!$depense) {
            return $this->json(['error' => 'Dépense invalide'], 404);
        }

        // Préparer les données de sortie
        $output = [
            'id' => $depense->getId(),
            'date' => $depense->getDate()->format('Y-m-d'),
            'motif' => $depense->getMotif(),
            'type' => $depense->getType(), 
            'montant' => $depense->getMontant(), 
            'notes' => $depense->getNote(),
            'utilisateur' => $depense->getUser() ? $depense->getUser()->getUsername() : 'Système'
        ];

        return new JsonResponse($output);
    }

    #[Route('/api/depenses/{id}/update', name: 'api_depense_update', methods: ['PUT'])]
    public function updateDepense(Depense $depense, EntityManagerInterface $em, Request $req): JsonResponse
    {
        if (!$depense) {
            return $this->json(['error' => 'Dépense invalide'], 404);
        }

        // Récupérer les données du corps de la requête
        $data = json_decode($req->getContent(), true);

        // Mettre à jour les propriétés
        if (isset($data['date'])) {
            $depense->setDate(new \DateTimeImmutable($data['date']));
        }
        if (isset($data['motif'])) {
            $depense->setMotif($data['motif']);
        }
        if (isset($data['type'])) {
            $depense->setType($data['type']);
        }
        if (isset($data['montant'])) {
            $depense->setMontant($data['montant']);
        }
        if (isset($data['notes'])) {
            $depense->setNote($data['notes']);
        }

        // Mettre à jour la transaction associée si le montant a changé
        $transaction = $depense->getTransaction();
        if ($transaction && isset($data['montant'])) {
            $transaction->setCFA(-$data['montant']);
            $transaction->setDescrib('Dépense: ' . ($data['motif'] ?? $depense->getMotif()));
            $em->persist($transaction);
        }

        $depense->setDate(new \DateTimeImmutable()); // Mettre à jour la date de modification

        $em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Dépense modifiée avec succès'
        ]);
    }

    #[Route('/api/depenses/{id}/delete', name: 'api_depense_delete', methods: ['DELETE'])]
    public function deleteDepense(Depense $depense, EntityManagerInterface $em, Request $req): JsonResponse
    {
        if (!$depense) {
            return $this->json(['error' => 'Dépense invalide'], 404);
        }

        // Récupérer la raison de suppression (optionnelle)
        $data = json_decode($req->getContent(), true);
        $raison = $data['raison'] ?? '';

        // Supprimer la transaction associée si elle existe
        $transaction = $depense->getTransaction();
        if ($transaction) {
            $em->remove($transaction);
        }

        // Supprimer la dépense
        $em->remove($depense);
        $em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Dépense supprimée avec succès'
        ]);
    }
 
    #[Route('/api/approvisionnement/create', name: 'api_approvisionnement_create', methods: ['POST'])]
    public function createApprovisionnement(EntityManagerInterface $em, Request $req): JsonResponse
    {
        $data = json_decode($req->getContent(), true);

        if (empty($data)) {
            return new JsonResponse(['error' => 'Données manquantes'], 400);
        }

        $approvisionnement = new Approvisionnement();
        $approvisionnement->setDate(new \DateTimeImmutable($data['date']));
        $approvisionnement->setMotif($data['motif']);
        $approvisionnement->setType($data['type']);
        $approvisionnement->setMontant($data['montant']);
        $approvisionnement->setNote($data['notes'] ?? '');

        $user = $this->getUser();
        if ($user) {
            $approvisionnement->setUser($user);
        }

        // Créer la transaction comptable (montant positif pour un approvisionnement)
        $agence = $em->getRepository(Agence::class)->findOneBy(['id' => 1]);
        $transaction = new AccountTransaction();
        $transaction->setCFA($data['montant']) // Montant positif pour un approvisionnement
                    ->setDescrib('Approvisionnement: ' . $data['motif'])
                    ->setAgence($agence)
                    ->setCreatedAt(new \DateTimeImmutable($data['date']));

        $approvisionnement->setTransaction($transaction);

        $em->persist($approvisionnement);
        $em->persist($transaction);
        $em->flush();

        return new JsonResponse(['success' => true, 'approvisionnementId' => $approvisionnement->getId()]);
    }

    #[Route('/api/approvisionnements', name: 'api_approvisionnement_list', methods: ['GET'])]
    public function listApprovisionnements(EntityManagerInterface $em, Request $req): JsonResponse
    {
        $startDate = $req->query->get('dateFrom');
        $endDate = $req->query->get('dateTo');
        $type = $req->query->get('type');

        $queryBuilder = $em->getRepository(Approvisionnement::class)->createQueryBuilder('a');

        if ($startDate && $endDate) {
            $queryBuilder->andWhere('a.date BETWEEN :start AND :end')
                ->setParameter('start', new \DateTime($startDate))
                ->setParameter('end', new \DateTime($endDate));
        }

        if ($type) {
            $queryBuilder->andWhere('a.type = :type')
                ->setParameter('type', $type);
        }

        $queryBuilder->orderBy('a.date', 'DESC');
        $approvisionnements = $queryBuilder->getQuery()->getResult();

        $output = array_map(function ($appro) {
            return [
                'id' => $appro->getId(),
                'date' => $appro->getDate()->format('Y-m-d'),
                'motif' => $appro->getMotif(),
                'type' => $appro->getType(),
                'montant' => $appro->getMontant(),
                'notes' => $appro->getNote(),
                'utilisateur' => $appro->getUser() ? $appro->getUser()->getUsername() : 'Système'
            ];
        }, $approvisionnements);

        return new JsonResponse($output);
    }

    #[Route('/api/approvisionnements/stats', name: 'api_approvisionnement_stats', methods: ['GET'])]
    public function statsApprovisionnements(EntityManagerInterface $em, Request $req): JsonResponse
    {
        $startDate = $req->query->get('dateFrom');
        $endDate = $req->query->get('dateTo');
        $type = $req->query->get('type');

        $qb = $em->getRepository(Approvisionnement::class)->createQueryBuilder('a');

        if ($startDate && $endDate) {
            $qb->andWhere('a.date BETWEEN :start AND :end')
                ->setParameter('start', new \DateTime($startDate))
                ->setParameter('end', new \DateTime($endDate));
        }

        if ($type) {
            $qb->andWhere('a.type = :type')
                ->setParameter('type', $type);
        }

        $approvisionnements = $qb->getQuery()->getResult();

        $totalApprovisionnements = count($approvisionnements);
        $totalMontant = 0;
        $parCategorie = [];

        foreach ($approvisionnements as $appro) {
            $totalMontant += $appro->getMontant();
            $categorie = $appro->getType();
            if (!isset($parCategorie[$categorie])) {
                $parCategorie[$categorie] = $appro->getMontant();
            } else {
                $parCategorie[$categorie] += $appro->getMontant();
            }
        }

        $stats = [
            'periode' => $startDate && $endDate ? [
                'du' => $startDate,
                'au' => $endDate,
            ] : 'Toutes périodes',
            'nombre_total' => $totalApprovisionnements,
            'montant_total' => $totalMontant,
            'par_categorie' => $parCategorie,
        ];

        return new JsonResponse($stats);
    }

    #[Route('/api/approvisionnements/{id}', name: 'api_approvisionnement_details', methods: ['GET'])]
    public function detailsApprovisionnement(Approvisionnement $approvisionnement, EntityManagerInterface $em, Request $req): JsonResponse
    {
        if (!$approvisionnement) {
            return $this->json(['error' => 'Approvisionnement invalide'], 404);
        }

        $output = [
            'id' => $approvisionnement->getId(),
            'date' => $approvisionnement->getDate()->format('Y-m-d'),
            'motif' => $approvisionnement->getMotif(),
            'type' => $approvisionnement->getType(),
            'montant' => $approvisionnement->getMontant(),
            'notes' => $approvisionnement->getNote(),
            'utilisateur' => $approvisionnement->getUser() ? $approvisionnement->getUser()->getUsername() : 'Système'
        ];

        return new JsonResponse($output);
    }

    #[Route('/api/approvisionnements/{id}/update', name: 'api_approvisionnement_update', methods: ['PUT'])]
    public function updateApprovisionnement(Approvisionnement $approvisionnement, EntityManagerInterface $em, Request $req): JsonResponse
    {
        if (!$approvisionnement) {
            return $this->json(['error' => 'Approvisionnement invalide'], 404);
        }

        $data = json_decode($req->getContent(), true);

        if (isset($data['date'])) {
            $approvisionnement->setDate(new \DateTimeImmutable($data['date']));
        }
        if (isset($data['motif'])) {
            $approvisionnement->setMotif($data['motif']);
        }
        if (isset($data['type'])) {
            $approvisionnement->setType($data['type']);
        }
        if (isset($data['montant'])) {
            $approvisionnement->setMontant($data['montant']);
        }
        if (isset($data['notes'])) {
            $approvisionnement->setNote($data['notes']);
        }

        // Mettre à jour la transaction associée si le montant a changé
        $transaction = $approvisionnement->getTransaction();
        if ($transaction && isset($data['montant'])) {
            $transaction->setCFA($data['montant']);
            $transaction->setDescrib('Approvisionnement: ' . ($data['motif'] ?? $approvisionnement->getMotif()));
            $em->persist($transaction);
        }

        $em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Approvisionnement modifié avec succès'
        ]);
    }

    #[Route('/api/approvisionnements/{id}/delete', name: 'api_approvisionnement_delete', methods: ['DELETE'])]
    public function deleteApprovisionnement(Approvisionnement $approvisionnement, EntityManagerInterface $em, Request $req): JsonResponse
    {
        if (!$approvisionnement) {
            return $this->json(['error' => 'Approvisionnement invalide'], 404);
        }

        $data = json_decode($req->getContent(), true);
        $raison = $data['raison'] ?? '';

        $transaction = $approvisionnement->getTransaction();
        if ($transaction) {
            $em->remove($transaction);
        }

        $em->remove($approvisionnement);
        $em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Approvisionnement supprimé avec succès'
        ]);
    } 
}