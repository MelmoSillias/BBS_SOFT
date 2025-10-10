<?php

namespace App\Controller;

use App\Entity\AccountTransaction;
use App\Entity\Agence;
use App\Entity\Client;
use App\Entity\Transfert;
use Doctrine\ORM\EntityManager;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mime\Message;
use Symfony\Component\Routing\Attribute\Route;

final class TransfertController extends AbstractController
{
    #[Route('/dashboard/transfert', name: 'app_transfert')]
    public function index(EntityManagerInterface $em): Response
    {
        $clients = $em->getRepository(Client::class)->findAll();
        $agences = $em->getRepository(Agence::class)->findAll();

        return $this->render('transfert/index.html.twig', [
            'controller_name' => 'TransfertController',
            'clients' => $clients,
            'agences' => $agences
        ]);
    }

    #[Route('/api/transfert/create', name: 'api_transfert_create', methods: ['POST'])]
    public function createTransfert(EntityManagerInterface $em, Request $req): JsonResponse
    {
        // Récupérer les données du corps de la requête
        $data = json_decode($req->getContent(), true);

        // Vérifier si les données sont valides
        if (empty($data)) {
            return new JsonResponse(['error' => 'Erreur de données'], 400);
        }

        $agence = $em->getRepository(Agence::class)->findOneBy(['id' => $data['destination']]);
        $local = $em->getRepository(Agence::class)->findOneBy(['id' => 1]);
        $amount = $data['totalAPayer'];

        // Créer une nouvelle instance de Transfert
        $transfert = new Transfert();

        // Définir les propriétés de l'entité Transfert
        $transfert->setCreatedAt(new \DateTimeImmutable($data['date']));
        $transfert->setType($data['type']);
        $transfert->setAgence($agence);
        $transfert->setMontantCFA($data['montantCash']);
        $transfert->setMontantUSD($data['montantUSD']);
        $transfert->setMontantReception($data['montantDeviseReception']);
        $transfert->setTaux($data['taux']);
        $transfert->setFrais($data['fraisEnvoi']);
        $transfert->setReceiverName($data['nomBeneficiaire']);
        $transfert->setReceiverPhone($data['phoneBeneficiaire']);
        $transfert->setStatus($data['moneyReceived'] ? 'processing' : 'pending');

        // Gérer le client éphémère
        if (isset($data['newExpediteurNom']) && isset($data['newExpediteurPhone'])) {
            $transfert->setSenderName($data['newExpediteurNom']);
            $transfert->setSenderPhone($data['newExpediteurPhone']);
            $clientName = $data['newExpediteurNom'];

            if ($transfert->getStatus() == 'processing') {
                $ctx = new AccountTransaction();
                $ctx->setCFA($amount)
                    ->setDescrib('Envoi cash - ' . ($transfert->getClient() ? $transfert->getClient()->getNomComplet() : $transfert->getSenderName()))
                    ->setAgence($local)
                    ->setCreatedAt(new \DateTimeImmutable($data['date']));

                $ctx->setTransfert($transfert);
                $em->persist($ctx);
            }
        } else {
            // Si un client existant est sélectionné, vous devez récupérer l'entité Client correspondante
            $clientId = $data['expediteur'];
            $client = $em->getRepository(Client::class)->find($clientId);

            if ($client) {
                $transfert->setClient($client);
                $clientName = $client->getNomComplet();
            }

            if ($transfert->getType() === "byAccount") {
            } else {
                if ($transfert->getStatus() == 'processing') {
                    $ctx = new AccountTransaction();
                    $ctx->setCFA($amount)
                        ->setDescrib('Envoi cash - ' . ($transfert->getClient() ? $transfert->getClient()->getNomComplet() : $transfert->getSenderName()))
                        ->setAgence($local)
                        ->setCreatedAt(new \DateTimeImmutable($data['date']));

                    $ctx->setTransfert($transfert);
                    $em->persist($ctx);
                }
            }
        }

        $ref = $this->generateReference($em);
        $transfert->setRef($ref);
        // Persister et sauvegarder l'entité
        $em->persist($transfert);
        $em->flush();

        // Retourner une réponse JSON
        return new JsonResponse(['success' => true, 'transfertId' => $transfert->getId()]);
    }

    #[Route('/api/transferts', name: 'api_transfert_list', methods: ['GET'])]
    public function listTransferts(EntityManagerInterface $em, Request $req): JsonResponse
    {
        // Récupérer les paramètres de la requête
        $startDate = $req->query->get('dateFrom');
        $endDate = $req->query->get('dateTo');
        $status = $req->query->get('status');
        $clientType = $req->query->get('clientType'); // 'vanish' ou 'present'
        $operationType = $req->query->get('type');
        $clientName = $req->query->get('clientName');

        // Créer une requête de base
        $queryBuilder = $em->getRepository(Transfert::class)->createQueryBuilder('t');

        // Appliquer les filtres
        if ($startDate && $endDate) {
            $queryBuilder->andWhere('t.createdAt BETWEEN :start AND :end')
                ->setParameter('start', new \DateTime($startDate))
                ->setParameter('end', new \DateTime($endDate));
        }

        if ($status) {
            $queryBuilder->andWhere('t.status = :status')
                ->setParameter('status', $status);
        }

        if ($operationType) {
            $queryBuilder->andWhere('t.type = :operationType')
                ->setParameter('operationType', $operationType);
        }

        if ($clientType === 'ephemeral') {
            $queryBuilder->andWhere('t.client IS NULL');
        } elseif ($clientType === 'regular') {
            $queryBuilder->andWhere('t.client IS NOT NULL');
        }

        $queryBuilder->addOrderBy('t.id', ' DESC');

        // Récupérer les résultats sans le filtre de nom pour pouvoir filtrer sur le nom complet
        $transferts = $queryBuilder->getQuery()->getResult();

        // Filtrer les résultats par nom de client
        if ($clientName) {
            $transferts = array_filter($transferts, function ($transfert) use ($clientName) {
                $nomComplet = $transfert->getSenderName() ?: ($transfert->getClient() ? $transfert->getClient()->getNomComplet() : '');
                return stripos($nomComplet, $clientName) !== false;
            });
        }


        // Préparer les données de sortie
        $output = array_map(function ($transfert) {
            $nomComplet = $transfert->getSenderName() ?: ($transfert->getClient() ? $transfert->getClient()->getNomComplet() : '');
            $telephone = $transfert->getSenderPhone() ?: ($transfert->getClient() ? $transfert->getClient()->getPhoneNumber() : '');

            return [
                'id' => $transfert->getId(),
                'createdAt' => $transfert->getCreatedAt()->format('Y-m-d H:i:s'),
                'type' => $transfert->getType(),
                'clientType' => $transfert->getClient() ? "registered" : "ephemeral",
                'destination' => [
                    'id' => $transfert->getAgence()->getId(),
                    'name' => $transfert->getAgence()->getDesignation(),
                    'localite' => $transfert->getAgence()->getLocalite(),
                    'devise' => $transfert->getAgence()->getDeviseLocal(),
                    'abg' => $transfert->getAgence()->getAbg(),
                    'isActive' => $transfert->getAgence()->IsActive(),
                ],
                'expediteur' => $nomComplet,
                'exp-phone' => $telephone,
                'montantCFA' => $transfert->getMontantCFA(),
                'montantUSD' => $transfert->getMontantUSD(),
                'montantReception' => $transfert->getMontantReception(),
                'taux' => $transfert->getTaux(),
                'frais' => $transfert->getFrais(),
                'receiverName' => $transfert->getReceiverName(),
                'receiverPhone' => $transfert->getReceiverPhone(),
                'status' => $transfert->getStatus(),
                'ref' => $transfert->getRef()
            ];
        }, $transferts);

        return new JsonResponse($output);
    }

    #[Route('/api/transferts/stats', name: 'api_transfert_stats', methods: ['GET'])]
    public function statsTransferts(EntityManagerInterface $em, Request $req): JsonResponse
    {
        // Récupération des dates (optionnelles)
        $startDate = $req->query->get('dateFrom');
        $endDate = $req->query->get('dateTo');

        $qb = $em->getRepository(Transfert::class)->createQueryBuilder('t');
        $qbPending = clone $qb;
        $qbPending->andWhere('t.status = :pendingStatus')
            ->setParameter('pendingStatus', 'pending');
        $pendingCount = count($qbPending->getQuery()->getResult());

        $qbProcessing = clone $qb;
        $qbProcessing->andWhere('t.status = :processingStatus')
            ->setParameter('processingStatus', 'processing');
        $processingCount = count($qbProcessing->getQuery()->getResult());
        // Filtre par période

        if ($startDate && $endDate) {
            $qb->andWhere('t.createdAt BETWEEN :start AND :end')
                ->setParameter('start', new \DateTime($startDate))
                ->setParameter('end', new \DateTime($endDate));
        }

        $transferts = $qb->getQuery()->getResult();

        // Initialisation des stats
        $totalTransferts = count($transferts);
        $totalMontantCash = 0;
        $totalMontantReception = 0;
        $totalFrais = 0;

        $parStatut = [
            'en_attente' => 0,
            'valide' => 0,
            'annule' => 0,
        ];

        $parTypeClient = [
            'ephemere' => 0,
            'enregistre' => 0,
        ];

        $parTypeOperation = [];

        foreach ($transferts as $transfert) {
            $totalMontantCash += $transfert->getMontantCFA();
            $totalMontantReception += $transfert->getMontantUSD();
            $totalFrais += $transfert->getFrais();

            // Par statut
            $statut = $transfert->getStatus();
            if ($statut === 'pending' || $statut === 0) $parStatut['en_attente']++;
            elseif ($statut === 'completed' || $statut === 1) $parStatut['valide']++;
            elseif ($statut === 'cancelled' || $statut === 2) $parStatut['annule']++;

            // Par type de client
            if ($transfert->getClient() === null) {
                $parTypeClient['ephemere']++;
            } else {
                $parTypeClient['enregistre']++;
            }

            // Par type d’opération
            $typeOp = $transfert->getType();
            if (!isset($parTypeOperation[$typeOp])) {
                $parTypeOperation[$typeOp] = 1;
            } else {
                $parTypeOperation[$typeOp]++;
            }
        }

        $stats = [
            'periode' => $startDate && $endDate ? [
                'du' => $startDate,
                'au' => $endDate,
            ] : 'Toutes périodes',
            'nombre_total' => $totalTransferts,
            'montant_total_cash' => $totalMontantCash,
            'montant_total_reception' => $totalMontantReception,
            'frais_totaux' => $totalFrais,
            'par_statut' => $parStatut,
            'par_type_client' => $parTypeClient,
            'par_type_operation' => $parTypeOperation,
            'pendings' => [
                'count' => $pendingCount,
                'cfa' => array_reduce($qbPending->getQuery()->getResult(), fn($sum, $t) => $sum + $t->getMontantCFA(), 0),
                'usd' => array_reduce($qbPending->getQuery()->getResult(), fn($sum, $t) => $sum + $t->getMontantUSD(), 0),
            ],
            'processings' => [
                'count' => $processingCount,
                'cfa' => array_reduce($qbProcessing->getQuery()->getResult(), fn($sum, $t) => $sum + $t->getMontantCFA(), 0),
                'usd' => array_reduce($qbProcessing->getQuery()->getResult(), fn($sum, $t) => $sum + $t->getMontantUSD(), 0),
            ],
        ];

        return new JsonResponse($stats);
    }


    #[Route('/api/transferts/{transfert}', name: 'api_transfert_details', methods: ['GET'])]
    public function DetailsTransfert(Transfert $transfert, EntityManagerInterface $em, Request $req): JsonResponse
    {

        if (!$transfert) {
            return $this->json(['error' => 'Transfert invalide'], 404);
        }

        $nomComplet = $transfert->getSenderName() ?: ($transfert->getClient() ? $transfert->getClient()->getNomComplet() : '');
        $telephone = $transfert->getSenderPhone() ?: ($transfert->getClient() ? $transfert->getClient()->getPhoneNumber() : '');
        // Préparer les données de sortie
        $output =  [
            'id' => $transfert->getId(),
            'createdAt' => $transfert->getCreatedAt()->format('Y-m-d'),
            'type' => $transfert->getType(),
            'destination' => [
                'id' => $transfert->getAgence()->getId(),
                'name' => $transfert->getAgence()->getDesignation(),
                'localite' => $transfert->getAgence()->getLocalite(),
                'devise' => $transfert->getAgence()->getDeviseLocal(),
                'abg' => $transfert->getAgence()->getAbg(),
                'isActive' => $transfert->getAgence()->IsActive(),
            ],
            'clientType' => $transfert->getClient() ? 'registered' : 'ephemeral',
            'expediteur' => $nomComplet,
            'expediteurId' => $transfert->getClient() ?  $transfert->getClient()->getId() : null,
            'phone' => $telephone,
            'montantCFA' => $transfert->getMontantCFA(),
            'montantUSD' => $transfert->getMontantUSD(),
            'montantReception' => $transfert->getMontantReception(),
            'taux' => $transfert->getTaux(),
            'frais' => $transfert->getFrais(),
            'receiverName' => $transfert->getReceiverName(),
            'receiverPhone' => $transfert->getReceiverPhone(),
            'status' => $transfert->getStatus(),
            'ref' => $transfert->getRef()
        ];

        return new JsonResponse($output);
    }

    #[Route('/api/transferts/{id}/process/{date}', name: 'api_transfer_process', methods: ['POST'])]
    public function processTransfer(Transfert $transfer, String $date, EntityManagerInterface $em): JsonResponse
    {
        // Vérifier que le transfert peut être validé (statut pending par exemple)
        if ($transfer->getStatus() !== Transfert::STATUS_PENDING) {
            return $this->json([
                'success' => false,
                'message' => 'Le transfert ne peut pas être mis en traitement dans son état actuel'
            ], Response::HTTP_BAD_REQUEST);
        }

        $local = $em->getRepository(Agence::class)->findOneBy(['id' => 1]);

        $client = $transfer->getClient();
        $amount = $transfer->getMontantCFA() + $transfer->getFrais();

        $ctx = new AccountTransaction();
        $ctx->setCFA($amount)
            ->setDescrib('Envoi cash - ' . ($transfer->getClient() ? $transfer->getClient()->getNomComplet() : $transfer->getSenderName()))
            ->setAgence($local)
            ->setCreatedAt(new \DateTimeImmutable($date));

        $ctx->setTransfert($transfer);
        $em->persist($ctx);

        $transfer->setStatus(Transfert::STATUS_PROCESSING);
        $transfer->setUpdatedAt(new \DateTimeImmutable($date));

        $em->flush();

        return $this->json([
            'success' => false,
            'message' => 'Le transfert a été validé avec succès'
        ], Response::HTTP_OK);
    }

    #[Route('/api/transferts/{id}/validate/{date}', name: 'api_transfer_validate', methods: ['POST'])]
    public function validateTransfer(Transfert $transfer, String $date, EntityManagerInterface $em): JsonResponse
    {
        // Vérifier que le transfert peut être validé (statut pending par exemple)
        if ($transfer->getStatus() !== Transfert::STATUS_PENDING && $transfer->getStatus() !== Transfert::STATUS_PROCESSING) {
            return $this->json([
                'success' => false,
                'message' => 'Le transfert ne peut pas être validé dans son état actuel'
            ], Response::HTTP_BAD_REQUEST);
        }

        if ($transfer->getStatus() === Transfert::STATUS_PROCESSING) {
            $atx = new AccountTransaction();
            $atx->setUSD($transfer->getMontantUSD() * -1)
                ->setDescrib('Transfert -- ' . ($transfer->getClient() ? $transfer->getClient()->getNomComplet() : $transfer->getSenderName()) . ' -- ' . $transfer->getMontantUSD() . ' USD')
                ->setAgence($transfer->getAgence())
                ->setCreatedAt(new \DateTimeImmutable($date));

            $atx->setTransfert($transfer);
            $em->persist($atx);

            if ($transfer->getType() === "byAccount") {
                $client = $transfer->getClient();
                $balance = $client->getbalance("CFA");
                $amount = $transfer->getMontantCFA() + $transfer->getFrais();

                $ctx = new AccountTransaction();
                $ctx->setCFA($amount * -1)
                    ->setDescrib('Retrait compte - ' . $transfer->getClient()->getNomComplet())
                    ->setClient($client)
                    ->setCreatedAt(new \DateTimeImmutable($date));

                $ctx->setTransfert($transfer);

                $em->persist($ctx);
            }
        } else {

            $local = $em->getRepository(Agence::class)->findOneBy(['id' => 1]);

            $client = $transfer->getClient();
            $amount = $transfer->getMontantCFA() + $transfer->getFrais();

            $ctx = new AccountTransaction();
            $ctx->setCFA($amount)
                ->setDescrib('Envoi cash - ' . ($transfer->getClient() ? $transfer->getClient()->getNomComplet() : $transfer->getSenderName()))
                ->setAgence($local)
                ->setCreatedAt(new \DateTimeImmutable($date));

            $ctx->setTransfert($transfer);
            $em->persist($ctx);

            $atx = new AccountTransaction();
            $atx->setUSD($transfer->getMontantUSD() * -1)
                ->setDescrib('Transfert -- ' . ($transfer->getClient() ? $transfer->getClient()->getNomComplet() : $transfer->getSenderName()) . ' -- ' . $transfer->getMontantUSD() . ' USD')
                ->setAgence($transfer->getAgence())
                ->setCreatedAt(new \DateTimeImmutable($date));

            $atx->setTransfert($transfer);
            $em->persist($atx);
        }

        $transfer->setStatus(Transfert::STATUS_COMPLETED);
        $transfer->setUpdatedAt(new \DateTimeImmutable());

        $em->flush();

        return $this->json([
            'success' => false,
            'message' => 'Le transfert a été validé avec succès'
        ], Response::HTTP_OK);
    }

    #[Route('/api/transferts/{id}/cancel', name: 'api_transfer_cancel', methods: ['POST'])]
    public function cancelTransfer(
        Transfert $transfer,
        Request $request,
        EntityManagerInterface $em
    ): JsonResponse {
        // Vérifier que le transfert peut être annulé
        if (!in_array($transfer->getStatus(), [Transfert::STATUS_PENDING, Transfert::STATUS_PROCESSING])) {
            return $this->json([
                'success' => false,
                'message' => 'Le transfert ne peut pas être annulé dans son état actuel'
            ], Response::HTTP_BAD_REQUEST);
        }

        $data = json_decode($request->getContent(), true);

        $transfer->setStatus(Transfert::STATUS_CANCELLED);
        $transfer->setUpdatedAt(new \DateTimeImmutable());

        $txs = $transfer->getAccountTransactions();
        foreach ($txs as $tx) $em->remove($tx);

        $em->flush();

        return $this->json([
            'success' => false,
            'message' => 'Le transfert a été annulé'
        ], Response::HTTP_OK);
    }

    #[Route('/api/transferts/{id}/delete', name: 'api_transfer_delete', methods: ['DELETE'])]
    public function deleteTransfer(Transfert $transfer, EntityManagerInterface $em): JsonResponse
    {

        $txs = $transfer->getAccountTransactions();
        foreach ($txs as $tx) $em->remove($tx); 
        $em->remove($transfer);

        $em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Transfert supprimé avec succès'
        ]);
    }

    #[Route('/api/transferts/{id}/receipt', name: 'transfer_receipt')]
    public function generateReceipt(Transfert $transfer): Response
    {
        return $this->render('transfert/print.html.twig', [
            'transfert' => $transfer,
            'company' => [
                'name' => 'BSS',
                'full_name' => 'BUREAU DE SERVICES ET DE SOLUTIONS',
                'address' => '123 Avenue de la République, Dakar, Sénégal',
                'phone' => '+221 33 123 45 67',
                'email' => 'contact@bss.sn',
                'website' => 'www.bss.sn'
            ]
        ]);
    }

    private function getTotalTransferCount(EntityManagerInterface $em): int
    {
        $queryBuilder = $em->createQueryBuilder();
        $queryBuilder->select('COUNT(t.id)')
            ->from(Transfert::class, 't');
        $transferCount = $queryBuilder->getQuery()->getSingleScalarResult();
        return $transferCount + 1; // Incrémenter pour le nouveau transfert
    }

    private function referenceExists(EntityManagerInterface $em, string $ref): bool
    {
        $queryBuilder = $em->createQueryBuilder();
        $queryBuilder->select('COUNT(t.id)')
            ->from(Transfert::class, 't')
            ->where('t.ref = :ref')
            ->setParameter('ref', $ref);
        $count = $queryBuilder->getQuery()->getSingleScalarResult();
        return $count > 0;
    }

    private function generateReference(EntityManagerInterface $em): string
    {
        $transferCount = $this->getTotalTransferCount($em);
        $formattedTransferCount = str_pad($transferCount, 3, '0', STR_PAD_LEFT);
        $ref = 'BSS-T' . $formattedTransferCount;

        // Vérifier si la référence existe déjà
        while ($this->referenceExists($em, $ref)) {
            $transferCount++;
            $formattedTransferCount = str_pad($transferCount, 3, '0', STR_PAD_LEFT);
            $ref = 'BSS-T' . $formattedTransferCount;
        }

        return $ref;
    }


    #[Route('/api/transfert/update/{id}', name: 'api_transfert_update', methods: ['PUT'])]
    public function updateTransfert(Transfert $transfert, EntityManagerInterface $em, Request $req): JsonResponse
    {
        // Récupérer les données du corps de la requête
        $data = json_decode($req->getContent(), true);

        // Vérifier si les données sont valides
        if (empty($data)) {
            return new JsonResponse(['error' => 'Erreur de données'], 400);
        }

        // Récupérer l'agence de destination
        $agence = $em->getRepository(Agence::class)->findOneBy(['id' => $data['destination']]);
        $local = $em->getRepository(Agence::class)->findOneBy(['id' => 1]);

        // Supprimer les anciennes transactions associées
        $existingTransactions = $transfert->getAccountTransactions();
        foreach ($existingTransactions as $tx) {
            $em->remove($tx);
        }

        // Mettre à jour les propriétés de base du transfert
        $transfert->setCreatedAt(new \DateTimeImmutable($data['date']));
        $transfert->setType($data['type']);
        $transfert->setAgence($agence);
        $transfert->setMontantCFA($data['montantCash']);
        $transfert->setMontantUSD($data['montantUSD']);
        $transfert->setMontantReception($data['montantDeviseReception']);
        $transfert->setTaux($data['taux']);
        $transfert->setFrais($data['fraisEnvoi']);
        $transfert->setReceiverName($data['nomBeneficiaire']);
        $transfert->setReceiverPhone($data['phoneBeneficiaire']);
        $transfert->setStatus($data['moneyReceived'] ? 'processing' : 'pending');

        // Gérer le client éphémère ou existant
        if (isset($data['newExpediteurNom']) && isset($data['newExpediteurPhone'])) {
            $transfert->setSenderName($data['newExpediteurNom']);
            $transfert->setSenderPhone($data['newExpediteurPhone']);
            $clientName = $data['newExpediteurNom'];
            $transfert->setClient(null); // Pas de client associé pour un client éphémère
        } else {
            // Si un client existant est sélectionné, récupérer l'entité Client correspondante
            $clientId = $data['expediteur'];
            $client = $em->getRepository(Client::class)->find($clientId);
            $transfert->setSenderName(null);
            $transfert->setSenderPhone(null);
            if ($client) {
                $transfert->setClient($client);
                $clientName = $client->getNomComplet();
            }
        }

        // Logique de création des transactions selon le type et le statut
        $amount = $data['totalAPayer'];
        if ($transfert->getStatus() == 'processing' && $transfert->getType() === 'standard' ) {
            $ctx = new AccountTransaction();
            $ctx->setCFA($amount)
                ->setDescrib('Transfert effectué par cash - ' . ($transfert->getClient() ? $transfert->getClient()->getNomComplet() : $transfert->getSenderName()))
                ->setAgence($local)
                ->setCreatedAt(new \DateTimeImmutable($data['date']));
            $ctx->setTransfert($transfert);
            $em->persist($ctx);
        }

        // Persister et sauvegarder l'entité
        $em->persist($transfert);
        $em->flush();

        // Retourner une réponse JSON
        return new JsonResponse([
            'success' => true,
            'transfertId' => $transfert->getId(),
            'message' => 'Transfert mis à jour avec succès'
        ]);
    }
}
