<?php

namespace App\Controller;

use App\Entity\AccountTransaction;
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
    #[Route('/transfert', name: 'app_transfert')]
    public function index(EntityManagerInterface $em): Response
    {
        $clients = $em->getRepository(Client::class)->findAll();

        return $this->render('transfert/index.html.twig', [
            'controller_name' => 'TransfertController',
            'clients' => $clients
        ]);
    }

    #[Route('/api/transfert/create', name: 'api_transfert_create', methods: ['POST'])]
    public function createTransfert(EntityManagerInterface $em, Request $req): JsonResponse
    {
        // Récupérer les données du corps de la requête
        $data = json_decode($req->getContent(), true);
        
        dump($data);
        // Vérifier si les données sont valides
        if (empty($data)) {
            return new JsonResponse(['error' => 'Erreur de données'], 400);
        }

        // Créer une nouvelle instance de Transfert
        $transfert = new Transfert();

        // Définir les propriétés de l'entité Transfert
        $transfert->setCreatedAt(new \DateTimeImmutable());
        $transfert->setType($data['type']);
        $transfert->setDestination($data['destination']);
        $transfert->setMontantCash($data['montantCash']);
        $transfert->setDeviseCash('CFA'); // Exemple de devise
        $transfert->setMontantReception($data['montantRecu']);
        $transfert->setDeviseReception('USD'); // Exemple de devise
        $transfert->setTaux($data['taux']);
        $transfert->setFrais($data['fraisEnvoi']);
        $transfert->setReceiverName($data['nomBeneficiaire']);
        $transfert->setReceiverPhone($data['phoneBeneficiaire']);
        $transfert->setTauxDeviseReception($data['tauxReception']);
        $transfert->setStatus('pending'); 

        // Gérer le client éphémère
        if (isset($data['newExpediteurNom']) && isset($data['newExpediteurPhone'])) {
            $transfert->setVanishClientName($data['newExpediteurNom']);
            $transfert->setVanishClientPhone($data['newExpediteurPhone']);
            $clientName = $data['newExpediteurNom'];
        } else {
            // Si un client existant est sélectionné, vous devez récupérer l'entité Client correspondante
            $clientId = $data['expediteur'];
            $client = $em->getRepository(Client::class)->find($clientId);

            if ($client) {
                $transfert->setClient($client);
                $clientName = $client->getNomComplet();
            }

            if ($transfert->getType() === "byAccount") {

                $balance = $client->getbalance("CFA");

                $amount = $data['totalAPayer'];

                if ($balance < $amount) {
                    return new JsonResponse(['error' => 'le solde est insuffisant'], 400);
                } 

                $ctx = new AccountTransaction();
                $ctx->setIncome(0)
                    ->setOutcome($amount)
                    ->setAccountType('client')
                    ->setPaymentMethod('espèce')
                    ->setPaymentRef('')
                    ->setDevise('CFA')
                    ->setReason('Rétrait solde client')
                    ->setUpdatedAt(new \DateTimeImmutable())
                    ->setDescrib('Transfert effectué à partir du compte')
                    ->setClient($client) 
                    ->setCreatedAt(new \DateTimeImmutable())
                    ->setStatus('validé');

                $transfert->setTransaction($ctx);

                $em->persist($ctx);
            }
        }
        $ref = $this->generateReference($clientName, $em);
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
            $queryBuilder->andWhere('t.Type = :operationType')
                ->setParameter('operationType', $operationType);
        }

        if ($clientType === 'ephemeral') {
            $queryBuilder->andWhere('t.client IS NULL');
        } elseif ($clientType === 'regular') {
            $queryBuilder->andWhere('t.client IS NOT NULL');
        }

        // Récupérer les résultats sans le filtre de nom pour pouvoir filtrer sur le nom complet
        $transferts = $queryBuilder->getQuery()->getResult();

        // Filtrer les résultats par nom de client
        if ($clientName) {
            $transferts = array_filter($transferts, function ($transfert) use ($clientName) {
                $nomComplet = $transfert->getVanishClientName() ?: ($transfert->getClient() ? $transfert->getClient()->getNomComplet() : '');
                return stripos($nomComplet, $clientName) !== false;
            });
        }

        // Préparer les données de sortie
        $output = array_map(function ($transfert) {
            $nomComplet = $transfert->getVanishClientName() ?: ($transfert->getClient() ? $transfert->getClient()->getNomComplet() : '');
            return [
                'id' => $transfert->getId(),
                'createdAt' => $transfert->getCreatedAt()->format('Y-m-d H:i:s'),
                'type' => $transfert->getType(),
                'destination' => $transfert->getDestination(),
                'typeClient' => !$transfert->getClient() ? 'Client éphémère' : 'Client enregistré',
                'expediteur' => $nomComplet,
                'montantCash' => $transfert->getMontantCash(),
                'deviseCash' => $transfert->getDeviseCash(),
                'montantReception' => $transfert->getMontantReception(),
                'deviseReception' => $transfert->getDeviseReception(),
                'taux' => $transfert->getTaux(),
                'frais' => $transfert->getFrais(),
                'receiverName' => $transfert->getReceiverName(),
                'receiverPhone' => $transfert->getReceiverPhone(),
                'tauxDeviseReception' => $transfert->getTauxDeviseReception(),
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
            $totalMontantCash += $transfert->getMontantCash();
            $totalMontantReception += $transfert->getMontantReception();
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
        ];

        return new JsonResponse($stats);
    }


    #[Route('/api/transferts/{transfert}', name: 'api_transfert_details', methods: ['GET'])]
    public function DetailsTransfert(Transfert $transfert, EntityManagerInterface $em, Request $req): JsonResponse
    {

        if (!$transfert) {
            return $this->json(['error' => 'Transfert invalide'], 404);
        }

        $nomComplet = $transfert->getVanishClientName() ?: ($transfert->getClient() ? $transfert->getClient()->getNomComplet() : '');
        $telephone = $transfert->getVanishClientPhone() ?: ($transfert->getClient() ? $transfert->getClient()->getPhoneNumber() : '');
        // Préparer les données de sortie
        $output =  [
            'id' => $transfert->getId(),
            'createdAt' => $transfert->getCreatedAt()->format('Y-m-d H:i:s'),
            'type' => $transfert->getType(),
            'destination' => $transfert->getDestination(),
            'expediteur' => $nomComplet,
            'phone' => $telephone,
            'montantCash' => $transfert->getMontantCash(),
            'deviseCash' => $transfert->getDeviseCash(),
            'montantReception' => $transfert->getMontantReception(),
            'deviseReception' => $transfert->getDeviseReception(),
            'taux' => $transfert->getTaux(),
            'frais' => $transfert->getFrais(),
            'receiverName' => $transfert->getReceiverName(),
            'receiverPhone' => $transfert->getReceiverPhone(),
            'tauxDeviseReception' => $transfert->getTauxDeviseReception(),
            'status' => $transfert->getStatus(),
            'ref' => $transfert->getRef()
        ];

        return new JsonResponse($output);
    }

    #[Route('/api/transferts/{id}/validate', name: 'api_transfer_validate', methods: ['POST'])]
    public function validateTransfer(Transfert $transfer, EntityManagerInterface $em): JsonResponse
    {
        // Vérifier que le transfert peut être validé (statut pending par exemple)
        if ($transfer->getStatus() !== Transfert::STATUS_PENDING) {
            return $this->json([
                'success' => false,
                'message' => 'Le transfert ne peut pas être validé dans son état actuel'
            ], Response::HTTP_BAD_REQUEST);
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

        $tx = $transfer->getTransaction();
        if ($tx) $em->remove($tx);
        $em->remove($transfer);

        $em->flush();

        return $this->json([
            'success' => false,
            'message' => 'Le transfert a été annulé'
        ], Response::HTTP_OK);
    }

    #[Route('/api/transferts/{id}/delete', name: 'api_transfer_delete', methods: ['DELETE'])]
    public function deleteTransfer(Transfert $transfer, EntityManagerInterface $em): JsonResponse
    { 
 
        $tx = $transfer->getTransaction();

        if ($tx) $em->remove($tx);
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

    private function generateReference(string $clientName, EntityManagerInterface $em): string
    {
        // Obtenir trois lettres du nom du client
        $threeLetters = strtoupper(substr($clientName, 0, 3));

        // Obtenir les deux derniers chiffres de l'année actuelle
        $year = date('y');

        // Obtenir les deux chiffres du mois actuel
        $month = date('m');

        // Obtenir le nombre de transferts effectués dans le mois actuel
        $transferCount = $this->getTransferCountForCurrentMonth($em);

        // Formater le nombre de transferts sur trois chiffres
        $formattedTransferCount = str_pad($transferCount, 3, '0', STR_PAD_LEFT);

        // Combiner pour former la référence
        $ref = $threeLetters . $year . $month . $formattedTransferCount;

        return $ref;
    }

    private function getTransferCountForCurrentMonth(EntityManagerInterface $em): int
    {
        $start = date('Y-m-01');
        $end = date('Y-m-t');

        $queryBuilder = $em->createQueryBuilder();
        $queryBuilder->select('COUNT(t.id)')
            ->from(Transfert::class, 't')
            ->where('t.createdAt BETWEEN :start AND :end')
            ->setParameter('start', $start)
            ->setParameter('end', $end);

        $transferCount = $queryBuilder->getQuery()->getSingleScalarResult();

        return $transferCount + 1; // Increment to account for the current transfer
    }
}
