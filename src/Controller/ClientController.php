<?php

namespace App\Controller;

use App\Entity\AccountTransaction;
use App\Entity\Agence;
use App\Entity\Client;
use App\Entity\Exchange;
use App\Entity\Transfert;
use App\Repository\AccountTransactionRepository;
use DateTimeImmutable;
use Doctrine\ORM\EntityManager;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route as AnnotationRoute;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Polyfill\Intl\Icu\DateFormat\SecondTransformer;

final class ClientController extends AbstractController
{
    private const INTERCOMPTE_LABEL = 'transfert-intercompte';

    #[Route('/dashboard/client', name: 'app_client')]
    public function index(EntityManagerInterface $em): Response
    {
        $agences = $em->getRepository(Agence::class)->findAll();

        return $this->render('client/index.html.twig', [
            'controller_name' => 'ClientController',
            'agences' => $agences
        ]);
    }

    #[Route('/client/{id}/modify', name: 'client_modify_submit', methods: ['POST'])]
    public function modifySubmit(Client $client, Request $request, EntityManagerInterface $em): JsonResponse
    {
        // Récupération des champs
        $client->setNomComplet($request->request->get('nomComplet'))
            ->setPhoneNumber($request->request->get('phoneNumber'))
            ->setAddress($request->request->get('address'));

        $em->flush();
        return $this->json(['success' => true]);
    }

    #[Route('/dashboard/client/{id}/details', name: 'client_details_modal', methods: ['GET'])]
    public function ShowClient(Client $client, EntityManagerInterface $em): Response
    {
        $agences = $em->getRepository(Agence::class)->findAll();
        // On peut récupérer ici factures ou transactions si besoin
        return $this->render('client/client_show.html.twig', [
            'controller_name' => 'ClientController',
            'client' => $client,
            'agences' => $agences
        ]);
    }

    #[Route('/api/client/{id}/smalldetails', name: 'client_small_details', methods: ['GET'])]
    public function smallDetails(Client $client, Request $request, EntityManagerInterface $em): JsonResponse
    {
        if (!$client) {
            return $this->json(['error' => 'Client not found'], 404);
        }

        return $this->json([
            'id' => $client->getId(),
            'nomComplet' => $client->getNomComplet(),
            'phoneNumber' => $client->getPhoneNumber(),
            'address' => $client->getAddress(),
        ]);
    }

    #[Route('/dashboard/client/{id}/accompte', name: 'client_accompte_submit', methods: ['POST'])]
    public function accompteSubmit(Client $client, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $amount = (float) $request->request->get('amount', 0);
        $ref_payment = $request->request->get('reference', ''); // Référence de paiement
        $method_payment = $request->request->get('mode', ''); // Méthode de paiement
        $note = $request->request->get('note'); // Note de la transaction
        $cur = $request->request->get('currency', '');
        $date = $request->request->get('date');

        $cName = $client->getNomComplet();

        if ($amount <= 0) {
            return $this->json(['error' => 'Invalid amount'], 400);
        }

        // 1. Créer un enregistrement de transaction (acompte client)
        $tx = new AccountTransaction();
        $tx->setClient($client)
            ->setAmount($cur, $amount)
            ->setDescrib($note == '' ? "Depot $amount $cur" : $note)
            ->setCreatedAt(!$date ? new DateTimeImmutable("now") : new DateTimeImmutable($date))
            ->setType("Versement");
        $local = $em->getRepository(Agence::class)->findOneBy(["id" => 1]);

        $atx = new AccountTransaction();
        $atx->setAgence($local)
            ->setAmount($cur, $amount)
            ->setDescrib($note == '' ? "Depot $amount $cur compte " . $client->getNomComplet() : $note)
            ->setCreatedAt(!$date ? new DateTimeImmutable("now") : new DateTimeImmutable($date));
        // Lier les deux
        $tx->setLinkedTransaction($atx);
        $atx->setLinkedTransaction($tx);

        $em->persist($tx);
        $em->persist($atx);
        $em->flush();

        return $this->json(['success' => true, 'id' => $tx->getId()]);
    }

    #[Route('/dashboard/client/{id}/retrait', name: 'client_retrait_submit', methods: ['POST'])]
    public function retraitSubmit(Client $client, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $amount = (float) $request->request->get('amount', 0);
        $ref_payment = $request->request->get('reference', ''); // Référence de paiement
        $method_payment = $request->request->get('mode', ''); // Méthode de paiement
        $note = $request->request->get('note'); // Note de la transaction
        $cur = $request->request->get('currency', '');
        $date = $request->request->get('date');

        $balance = $client->getbalance($cur);
        $cName = $client->getNomComplet();

        // 1. Créer un enregistrement de transaction (acompte client)
        $tx = new AccountTransaction();
        $tx->setClient($client)
            ->setAmount($cur, $amount * -1)
            ->setDescrib($note == '' ? "Retrait $amount $cur" : $note)
            ->setCreatedAt(!$date ? new DateTimeImmutable("now") : new DateTimeImmutable($date))
            ->setType("Retrait");

        $local = $em->getRepository(Agence::class)->findOneBy(["id" => 1]);

        $atx = new AccountTransaction();
        $atx->setAgence($local)
            ->setAmount($cur, $amount * -1)
            ->setDescrib($note == '' ? "Retrait $amount $cur compte " . $client->getNomComplet() : $note)
            ->setCreatedAt(!$date ? new DateTimeImmutable("now") : new DateTimeImmutable($date));

        $tx->setLinkedTransaction($atx);
        $atx->setLinkedTransaction($tx);

        $em->persist($tx);
        $em->persist($atx);
        $em->flush();

        $em->flush();
        return $this->json(['success' => true, 'id' => $tx->getId()]);
    }

    #[Route('/dashboard/client/{id}/transfert-interclient', name: 'client_transfert_interclient_submit', methods: ['POST'])]
    public function transfertInterclientSubmit(Client $client, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $amount = (float) $request->request->get('amount', 0);
        $receiverId = (int) $request->request->get('receiverId', 0);
        $senderNote = trim((string) $request->request->get('senderNote', ''));
        $receiverNote = trim((string) $request->request->get('receiverNote', ''));
        $cur = $request->request->get('currency', 'CFA');
        $date = $request->request->get('date');

        if ($amount <= 0) {
            return $this->json(['error' => 'Montant invalide'], 400);
        }

        if ($receiverId <= 0 || $receiverId === $client->getId()) {
            return $this->json(['error' => 'Client destinataire invalide'], 400);
        }

        $receiver = $em->getRepository(Client::class)->find($receiverId);
        if (!$receiver) {
            return $this->json(['error' => 'Client destinataire introuvable'], 404);
        }

        $senderName = $client->getNomComplet();
        $receiverName = $receiver->getNomComplet();
        $createdAt = !$date ? new DateTimeImmutable('now') : new DateTimeImmutable($date);

        $senderTx = new AccountTransaction();
        $senderTx->setClient($client)
            ->setAmount($cur, (string) ($amount * -1))
            ->setDescrib($senderNote !== '' ? $senderNote : "Transfert vers $receiverName")
            ->setCreatedAt($createdAt)
            ->setType('Retrait');

        $receiverTx = new AccountTransaction();
        $receiverTx->setClient($receiver)
            ->setAmount($cur, (string) $amount)
            ->setDescrib($receiverNote !== '' ? $receiverNote : "Transfert de $senderName")
            ->setCreatedAt($createdAt)
            ->setType('Versement');

        $senderTx->setLinkedTransaction($receiverTx);
        $receiverTx->setLinkedTransaction($senderTx);

        $em->persist($senderTx);
        $em->persist($receiverTx);
        $em->flush();

        return $this->json(['success' => true, 'id' => $senderTx->getId()]);
    }


    #[Route('/api/clients', name: 'api_clients_list', methods: ['GET'])]
    public function clientsList(EntityManagerInterface $em): JsonResponse
    {
        $clients = $em->getRepository(Client::class)->findAll();
        $data = [];

        foreach ($clients as $client) {
            $data[] = [
                'id'           => $client->getId(),
                'nomComplet'  => $client->getNomComplet(),
                'phoneNumber'  => $client->getPhoneNumber(),
                'balanceCFA'      => $client->getbalance("CFA"),
                'balanceUSD'      => $client->getbalance("USD"),
                'balanceEUR'      => $client->getbalance("EUR"),
            ];
        }

        return $this->json(['data' => $data]);
    }

    #[Route('/api/clients/stats', name: 'api_clients_stats', methods: ['GET'])]
    public function clientsStats(EntityManagerInterface $em): JsonResponse
    {
        $repo = $em->getRepository(Client::class);
        $total  = count($repo->findAll());

        return $this->json([
            'total'  => $total,
        ]);
    }

    #[Route('/api/client/add', name: 'api_client_add', methods: ['POST'])]
    public function clientAdd(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $client = new Client();
        $client->setNomComplet($request->request->get('nomComplet'))
            ->setPhoneNumber($request->request->get('phoneNumber'))
            ->setAddress($request->request->get('address'))
            ->setISActive(true);
        $em->persist($client);
        $em->flush();
        return $this->json(['success' => true]);
    }

    #[Route('/api/client/{id}/deactivate', name: 'api_client_deactivate', methods: ['POST'])]
    public function clientDeactivate(Client $client, EntityManagerInterface $em): JsonResponse
    {
        // Désactivation soft
        $client->setIsActive(false);
        $em->flush();
        return $this->json(['success' => true]);
    }

    #[Route('/api/client/{id}/stats/{devise}', name: 'client_devise_balance', methods: ['GET'])]
    public function stats(Client $client, EntityManagerInterface $em, Request $req): JsonResponse
    {

        $cur = $req->get('devise');
        return $this->json([
            'balance'          => $client->getbalance($cur)
        ]);
    }

    #[Route('/api/client/{id}/stats', name: 'client_stats', methods: ['GET'])]
    public function AllStats(Client $client, EntityManagerInterface $em): JsonResponse
    {
        // Liste manuelle des devises supportées
        $supportedCurrencies = ['CFA', 'AED', 'EUR', 'USD', 'GBP', 'CNY', 'MAD', 'DZD'];

        $data = [];
        foreach ($supportedCurrencies as $currency) {
            $data[$currency] = $client->getBalance($currency);
        }

        return $this->json($data);
    }

    #[Route('/api/client/{id}/transactions', name: 'client_transactions', methods: ['GET'])]
    public function listTransactions(Client $client, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $startDate = $request->query->get('dateFrom');
        $endDate = $request->query->get('dateTo');

        $repo = $em->getRepository(AccountTransaction::class);
        $qb = $repo->createQueryBuilder('t')
            ->where('t.client = :client')
            ->setParameter('client', $client);

        if ($startDate && $endDate) {
            $qb->andWhere('t.createdAt BETWEEN :start AND :end')
                ->setParameter('start', new \DateTime($startDate . ' 00:00:00'))
                ->setParameter('end', new \DateTime($endDate . ' 23:59:59'));
        }

        $qb->orderBy('t.createdAt', 'DESC');
        $transactions = $qb->getQuery()->getResult();

        $list = [];
        foreach ($transactions as $tx) {
            $isInterClient = $tx->isInterClientTransfer();
            $list[] = [
                'id'          => $tx->getId(),
                'date'        => $tx->getCreatedAt()->format('Y-m-d H:i:s'),
                'type'        => $isInterClient ? self::INTERCOMPTE_LABEL : $tx->getType(),
                'description' => $tx->getDescrib(),
                'amountCFA'   => $tx->getCFA(),
                'amountAED'   => $tx->getAED(),
                'amountEUR'   => $tx->getEUR(),
                'amountUSD'   => $tx->getUSD(),
                'amountGBP'   => $tx->getGBP(),
                'amountCNY'   => $tx->getCNY(),
                'amountMAD'   => $tx->getMAD(),
                'amountDZD'   => $tx->getDZD(),
                'isInterClient' => $isInterClient,
                'currency'    => $tx->getActiveCurrency(),
                'montant'     => $tx->getActiveAmount(),
            ];
        }

        return $this->json(['data' => $list]);
    }

    #[Route('/api/client/{id}/transactions_report', name: 'client_transactions_report', methods: ['GET'])]
    public function reportTransactions(Client $client, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $startDate = $request->query->get('dateFrom');
        $endDate = $request->query->get('dateTo');

        $repo = $em->getRepository(AccountTransaction::class);
        $qb = $repo->createQueryBuilder('t')
            ->where('t.client = :client')
            ->setParameter('client', $client);

        if ($startDate && $endDate) {
            // Calculer le solde avant la période
            $balanceBefore = 0;
            $repoBefore = $em->getRepository(AccountTransaction::class);
            $qbBefore = $repoBefore->createQueryBuilder('tb')
                ->select('SUM(tb.CFA)')
                ->where('tb.client = :client')
                ->andWhere('tb.createdAt < :start')
                ->setParameter('client', $client)
                ->setParameter('start', new \DateTime($startDate));
            $resultBefore = $qbBefore->getQuery()->getResult();

            $balanceBefore = $resultBefore[0][1] ?? 0;
        } else {
            $balanceBefore = 0;
        }

        $currentBalance = $balanceBefore;

        if ($startDate && $endDate) {
            $qb->andWhere('t.createdAt BETWEEN :start AND :end')
                ->setParameter('start', new \DateTime($startDate . ' 00:00:00'))
                ->setParameter('end', new \DateTime($endDate . ' 23:59:59'));
        }

        $qb->orderBy('t.createdAt', 'DESC');
        $transactions = $qb->getQuery()->getResult();


        $list = [];
        foreach ($transactions as $tx) {
            $currentBalance += $tx->getCFA();
            $list[] = [
                'id'          => $tx->getId(),
                'date'        => $tx->getCreatedAt()->format('Y-m-d'),
                'description' => $tx->getDescrib(),
                'entree'      => $tx->getCFA() > 0 ? $tx->getCFA() : 0,
                'sortie'      => $tx->getCFA() < 0 ? abs($tx->getCFA()) : 0,
                'solde'       => $currentBalance,
            ];
        }

        return $this->json(['data' => $list, 'balanceBefore' => $balanceBefore, 'balanceAfter' => $currentBalance, 'solde' => $client->getBalance("CFA")]);
    }


    #[Route('/api/client/{client}/transferts', name: 'api_client_transfert_list', methods: ['GET'])]
    public function listTransferts(EntityManagerInterface $em, Client $client, Request $req): JsonResponse
    {
        // Récupérer les paramètres de la requête
        $startDate = $req->query->get('dateFrom');
        $endDate = $req->query->get('dateTo');
        $status = $req->query->get('status');
        $operationType = $req->query->get('type');

        // Créer une requête de base
        $queryBuilder = $em->getRepository(Transfert::class)->createQueryBuilder('t');

        $queryBuilder->andWhere('t.client = :client')
            ->setParameter('client', $client);

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

        // Récupérer les résultats sans le filtre de nom pour pouvoir filtrer sur le nom complet
        $transferts = $queryBuilder->getQuery()->getResult();


        // Préparer les données de sortie
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

    #[Route('/api/client/{client}/transferts/stats', name: 'api_client_transfert_stats', methods: ['GET'])]
    public function statsTransferts(EntityManagerInterface $em, Client $client, Request $req): JsonResponse
    {
        // Récupération des dates (optionnelles)
        $startDate = $req->query->get('dateFrom');
        $endDate = $req->query->get('dateTo');

        $qb = $em->getRepository(Transfert::class)->createQueryBuilder('t')->andWhere('t.client = :client')->setParameter('client', $client);

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
            'par_type_operation' => $parTypeOperation,
        ];

        return new JsonResponse($stats);
    }

    #[Route('/api/client/{id}/exchange', name: 'client_exchange_submit', methods: ['POST'])]
    public function exchangeSubmit(Client $client, Request $request, EntityManagerInterface $em): JsonResponse
    {
        // Récupérer les données de la requête   
        $type = $request->request->get('type', '');
        $montantdevise = (float) $request->request->get('montant', 0);
        $devise = $request->request->get('deviseExchange', '');

        $date = $request->request->get('date'); // Note de la transaction
        $taux = (float) $request->request->get('taux', 0); // Taux de change utilisé
        $agence = $em->getRepository(Agence::class)->findOneBy(['id' => $request->request->get('destination')]); // Agence de destination 

        $note =  $request->request->get('note');

        $montantCfa = $this->roundCFA($montantdevise * $taux); // Montant en CFA arrondi
        // Vérifier que le client a un solde suffisant dans la devise de départ

        // 0 - créer l'échange pour l'opération
        $exchange = new Exchange();
        $exchange->setMontantCFA($montantCfa);
        $exchange->setMontantDevise($montantdevise);
        $exchange->setDevise($devise);
        $exchange->setRef($this->generateReference($em));
        $exchange->setType($type);
        $exchange->setTaux($taux);
        $exchange->setClient($client);
        $exchange->setDescription($note ?? $type . " de " . $devise . " à " . $agence->getDesignation() . " sur compte");
        $exchange->setDate(!$date ? new DateTimeImmutable("now") : new DateTimeImmutable($date));
        

        // 1. Créer un enregistrement de transaction pour le client
        $clientTx = new AccountTransaction();
        $clientTx->setClient($client)
            ->setAmount('CFA', $type === "achat" ? $montantCfa * -1 : $montantCfa)
            ->setDescrib($type . " de " . $devise . " à " . $agence->getDesignation())
            ->setCreatedAt(!$date ? new DateTimeImmutable("now") : new DateTimeImmutable($date))
            ->setExchange($exchange)
            ->setDescrib($note ?? $type . " de " . $devise . " à " . $agence->getDesignation() . " sur compte");
         

        // 2. Créer un enregistrement pour l'agence
        if ($agence->getId() === 1) {
            $agenceTx = new AccountTransaction();
            $agenceTx->setAgence($agence);
            $agenceTx->setExchange($exchange);
            $agenceTx->setDescrib($note ?? $type . " de " . $devise . " à " . $agence->getDesignation() . " sur compte");
            $agenceTx->setCreatedAt(!$date ? new DateTimeImmutable("now") : new DateTimeImmutable($date));

            if ($type === "achat") {
                $agenceTx->setAmount($devise, $montantdevise * -1);
            } else {
                $agenceTx->setAmount($devise, $montantdevise);
            }
        } else {
            $agenceTx = new AccountTransaction();
            $agenceTx->setAgence($agence)
                ->setUSD($montantdevise)
                ->setExchange($exchange)
                ->setDescrib($note ?? $type . " de " . $devise . " sur compte " . $client->getNomComplet())
                ->setCreatedAt(!$date ? new DateTimeImmutable("now") : new DateTimeImmutable($date));
        } 

        // Persister les transactions dans la base de données
        $em->persist($exchange);
        $em->persist($clientTx);
        $em->persist($agenceTx);
        $em->flush();

        return $this->json(['success' => true, 'id' => $exchange->getId()]);
    }

    #[Route('/api/client/{id}/exchanges', name: 'client_exchange_list', methods: ['GET'])]
    public function clientExchangeList(Client $client, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $exchanges = $em->getRepository(Exchange::class)->findBy(['client' => $client]);

        return $this->json(array_map(function ($ex) {
            return [
                'id' => $ex->getId(),
                'date' => $ex->getDate()->format('Y-m-d'),
                'type' => $ex->getType(),
                'description' => $ex->getDescription(),
                'montantCFA' => $ex->getMontantCFA(),
                'montantDevise' => $ex->getMontantDevise(),
                'devise' => $ex->getDevise(),
                'taux' => $ex->getTaux(),
            ];
        }, $exchanges));
    }

    #[Route('/api/client/{client}/exchange/{id}/update', name: 'client_exchange_update', methods: ['PUT'])]
    public function exchangeUpdate(
        Client $client,
        Exchange $exchange,
        Request $request,
        EntityManagerInterface $em
    ): JsonResponse {
        // 🔹 Décoder le JSON brut du corps de la requête
        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json(['success' => false, 'message' => 'Aucune donnée valide reçue.'], 400);
        }

        // 🔹 Récupération des champs avec valeurs par défaut
        $type = $data['type'] ?? $exchange->getType();
        $montantdevise = isset($data['montant']) ? (float)$data['montant'] : $exchange->getMontantDevise();
        $devise = $data['deviseExchange'] ?? $exchange->getDevise();
        $taux = isset($data['taux']) ? (float)$data['taux'] : $exchange->getTaux();
        $date = $data['date'] ?? null;
        $note = $data['note'] ?? $exchange->getDescription();
        $agenceId = $data['destination'] ?? null;
        $agence = $agenceId ? $em->getRepository(Agence::class)->find($agenceId) : null;

        if (!$agence) {
            return $this->json(['success' => false, 'message' => 'Agence non trouvée.'], 400);
        }

        // --- Recalcul du montant en CFA ---
        $montantCfa = $this->roundCFA($montantdevise * $taux);

        // --- Mise à jour de l'objet Exchange ---
        $exchange->setMontantCFA($montantCfa);
        $exchange->setMontantDevise($montantdevise);
        $exchange->setDevise($devise);
        $exchange->setType($type);
        $exchange->setTaux($taux);
        $exchange->setClient($client);
        $exchange->setDescription($note ?? $type . " de " . $devise . " à " . $agence->getDesignation());
        $exchange->setDate(!$date ? new \DateTimeImmutable("now") : new \DateTimeImmutable($date));

        // --- Mise à jour des transactions liées ---
        $transactions = $em->getRepository(AccountTransaction::class)->findBy(['exchange' => $exchange]);
        foreach ($transactions as $tx) {
            if ($tx->getClient()) {
                $tx->setClient($client)
                    ->setExchange($exchange)
                    ->setDescrib($note ?? $type . " de " . $devise . " à " . $agence->getDesignation() . " sur compte")
                    ->setCreatedAt(!$date ? new \DateTimeImmutable("now") : new \DateTimeImmutable($date))
                    ->setAmount('CFA', $type === "achat" ? $montantCfa * -1 : $montantCfa);
                $exchange->addTransaction($tx);
                
            } elseif ($tx->getAgence()) {
                $tx->setAgence($agence)
                    ->setExchange($exchange) 
                    ->setDescrib($note ?? $type . " de " . $devise . " sur compte " . $client->getNomComplet())
                    ->setCreatedAt(!$date ? new \DateTimeImmutable("now") : new \DateTimeImmutable($date));

                if ($agence->getId() === 1) {
                    $tx->setAmount($devise, $type === "achat" ? $montantdevise * -1 : $montantdevise);
                } else {
                    $tx->setUSD($montantdevise);
                }
                $exchange->addTransaction($tx);
            } 
            $em->persist($tx);
        }

        $em->persist($exchange);
        $em->flush();

        return $this->json([
            'success' => true,
            'id' => $exchange->getId(),
            'message' => 'Échange mis à jour avec succès.'
        ]);
    }

    #[Route('/api/client/{client}/exchange/{id}', name: 'client_exchange_show', methods: ['GET'])]
    public function exchangeShow(
        Client $client,
        Exchange $exchange,
        EntityManagerInterface $em
    ): JsonResponse {
        // Vérifier que l'échange appartient bien au client
        if ($exchange->getClient()->getId() !== $client->getId()) {
            return $this->json([
                'success' => false,
                'message' => 'Cet échange n’appartient pas au client spécifié.'
            ], 403);
        }

        // Récupérer toutes les transactions associées à cet échange
        $transactions = $em->getRepository(AccountTransaction::class)
            ->findBy(['exchange' => $exchange]);

        // Identifier l’agence à partir d’une transaction d’agence (s’il y en a)
        $agenceData = null;
        foreach ($transactions as $tx) {
            if ($tx->getAgence()) {
                $agenceData = [
                    'id' => $tx->getAgence()->getId(),
                    'designation' => $tx->getAgence()->getDesignation(),
                ];
                break;
            }
        }
        // Formater les transactions pour la réponse JSON
        $transactionsData = array_map(function (AccountTransaction $tx) {
            return [
                'id' => $tx->getId(),
                'type' => $tx->getClient() ? 'client' : 'agence',
                'client' => $tx->getClient() ? $tx->getClient()->getNomComplet() : null,
                'agence' => $tx->getAgence() ? $tx->getAgence()->getDesignation() : null,
                'amount' => $tx->getAmount(),
                'currency' => $tx->getCurrencyName() ?? 'CFA',
                'description' => $tx->getDescrib(),
                'date' => $tx->getCreatedAt()?->format('Y-m-d H:i:s'),
            ];
        }, $transactions);

        // Construire la réponse principale
        $data = [
            'id' => $exchange->getId(),
            'ref' => $exchange->getRef(),
            'type' => $exchange->getType(),
            'devise' => $exchange->getDevise(),
            'taux' => $exchange->getTaux(),
            'montant_devise' => $exchange->getMontantDevise(),
            'montant_cfa' => $exchange->getMontantCFA(),
            'description' => $exchange->getDescription(),
            'date' => $exchange->getDate()?->format('Y-m-d H:i:s'),
            'client' => [
                'id' => $client->getId(),
                'nom' => $client->getNomComplet(),
            ],
            'agence' => $agenceData,
            'transactions' => $transactionsData,
        ];

        return $this->json([
            'success' => true,
            'data' => $data,
        ]);
    }



    #[Route('/api/transaction/{id}/receipt', name: 'transaction_receipt')]
    public function generateReceipt(AccountTransaction $transaction): Response
    {
        return $this->render('client/print.html.twig', [
            'transaction' => $transaction,
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

    #[Route('/api/transaction/{id}/cancel', name: 'transaction_cancel')]
    public function CancelTransaction(AccountTransaction $transaction, EntityManagerInterface $em): Response
    {
        if (!$transaction) {
            return $this->json([false, "La transaction n'existe pas"], 404);
        }

        // Si la transaction a une "sœur" liée
        if ($linked = $transaction->getLinkedTransaction()) {
            $transaction->setLinkedTransaction(null); // Détacher la relation
            $linked->setLinkedTransaction(null); // Détacher la relation

            $em->persist($transaction);
            $em->persist($linked);
            $em->flush();


            $em->remove($linked);
        }

        $em->remove($transaction);
        $em->flush();

        return $this->json([true, 200]);
    }


    #[Route('/api/transaction/{id}/details', name: 'transaction_details')]
    public function TransactionDetails(AccountTransaction $transaction, EntityManagerInterface $em, Request $request): Response
    {
        if (!$transaction) {
            return $this->json([false, "La transaction n'existe pas"], 404);
        }

        $currency = $transaction->getActiveCurrency() ?? 'CFA';
        $activeAmount = $transaction->getActiveAmount();
        $montant = $activeAmount !== null ? abs($activeAmount) : abs((float) ($transaction->getCFA() ?? 0));

        $otherClient = null;
        $senderClient = null;
        $receiverClient = null;
        $senderNote = null;
        $receiverNote = null;

        if ($transaction->isInterClientTransfer()) {
            $linked = $transaction->getLinkedTransaction();
            if ($linked) {
                $senderTx = $transaction->getType() === 'Retrait' ? $transaction : $linked;
                $receiverTx = $transaction->getType() === 'Versement' ? $transaction : $linked;

                if ($senderTx->getClient()) {
                    $senderClient = [
                        'id' => $senderTx->getClient()->getId(),
                        'nomComplet' => $senderTx->getClient()->getNomComplet(),
                    ];
                }
                if ($receiverTx->getClient()) {
                    $receiverClient = [
                        'id' => $receiverTx->getClient()->getId(),
                        'nomComplet' => $receiverTx->getClient()->getNomComplet(),
                    ];
                    $otherClient = $senderClient;
                    if ($transaction->getType() === 'Retrait') {
                        $otherClient = $receiverClient;
                    } else {
                        $otherClient = $senderClient;
                    }
                }

                $senderNote = $senderTx->getDescrib();
                $receiverNote = $receiverTx->getDescrib();
            }
        }

        return $this->json([
            'id' => $transaction->getId(),
            'type' => $transaction->isInterClientTransfer() ? self::INTERCOMPTE_LABEL : $transaction->getType(),
            'montant' => $montant,
            'currency' => $currency,
            'date' => $transaction->getCreatedAt()->format('Y-m-d'),
            'note' => $transaction->getDescrib(),
            'isInterClient' => $transaction->isInterClientTransfer(),
            'otherClient' => $otherClient,
            'senderClient' => $senderClient,
            'receiverClient' => $receiverClient,
            'senderNote' => $senderNote,
            'receiverNote' => $receiverNote,
        ]);
    }

    #[Route('/api/transaction/{id}/update', name: 'transaction_update')]
    public function UpdateTransaction(AccountTransaction $transaction, EntityManagerInterface $em, Request $request): Response
    {
        if (!$transaction) {
            return $this->json([false, "La transaction n'existe pas"], 404);
        }

        $amount = (float) ($request->get('amount') ?? $request->get('montant') ?? 0);
        $senderNote = trim((string) $request->get('senderNote', ''));
        $receiverNote = trim((string) $request->get('receiverNote', ''));
        $note = $request->get('note', '');
        $date = $request->get('date');
        $currency = strtoupper((string) ($request->get('currency') ?? ''));
        $clientName = $transaction->getClient() ? $transaction->getClient()->getNomComplet() : 'N/A';

        if ($transaction->isInterClientTransfer()) {
            $linked = $transaction->getLinkedTransaction();
            if (!$linked) {
                return $this->json(['error' => 'Transaction jumelle introuvable'], 400);
            }

            $senderTx = $transaction->getType() === 'Retrait' ? $transaction : $linked;
            $receiverTx = $transaction->getType() === 'Versement' ? $transaction : $linked;
            $activeCurrency = $currency !== '' ? $currency : ($transaction->getActiveCurrency() ?? 'CFA');
            $absAmount = abs($amount);
            $senderName = $senderTx->getClient()?->getNomComplet() ?? 'N/A';
            $receiverName = $receiverTx->getClient()?->getNomComplet() ?? 'N/A';

            $senderDesc = $senderNote !== '' ? $senderNote : "Transfert vers $receiverName";
            $receiverDesc = $receiverNote !== '' ? $receiverNote : "Transfert de $senderName";

            $senderTx->setExclusiveAmount($activeCurrency, (string) (-$absAmount))
                ->setDescrib($senderDesc);
            $receiverTx->setExclusiveAmount($activeCurrency, (string) $absAmount)
                ->setDescrib($receiverDesc);

            if ($date) {
                $createdAt = new DateTimeImmutable($date);
                $senderTx->setCreatedAt($createdAt);
                $receiverTx->setCreatedAt($createdAt);
            }

            $em->persist($senderTx);
            $em->persist($receiverTx);
            $em->flush();

            return $this->json(['success' => true]);
        }

        $transaction->setCFA($amount);

        $transaction->setDescrib($note == '' ? ($transaction->getType() === "Versement" ? "Depot $amount F CFA" : ($transaction->getType() === "Retrait" ? "Retrait $amount F CFA" : $transaction->getDescrib())) : $note);

        // Si la transaction a une "sœur" liée
        if ($linked = $transaction->getLinkedTransaction()) {
            $linked->setCFA($transaction->getCFA());
            $linked->setDescrib($note == '' ? ($transaction->getType() === "Versement" ? "Depot $amount F CFA" : ($transaction->getType() === "Retrait" ? "Retrait $amount F CFA" : $transaction->getDescrib())) : $note . " sur compte $clientName");
        }

        $em->persist($transaction);
        if (isset($linked)) {
            $em->persist($linked);
        }
        $em->flush();

        return $this->json([true, 200]);
    }

    private function getTotalExchangeCount(EntityManagerInterface $em): int
    {
        $queryBuilder = $em->createQueryBuilder();
        $queryBuilder->select('COUNT(t.id)')
            ->from(Exchange::class, 't');

        $transferCount = $queryBuilder->getQuery()->getSingleScalarResult();
        return $transferCount + 1; // Incrémenter pour le nouveau transfert
    }

    private function generateReference(EntityManagerInterface $em): string
    {
        // Obtenir le nombre total de transferts + 1
        $transferCount = $this->getTotalExchangeCount($em);
        // Formater le nombre sur trois chiffres
        $formattedTransferCount = str_pad($transferCount, 3, '0', STR_PAD_LEFT);
        // Combiner pour former la référence
        $ref = 'BSS-D' . $formattedTransferCount;
        return $ref;
    }

    private function roundCFA(float $amount): float
    {
        return round($amount / 50) * 50;
    }


    #[Route("/api/client/{id}/operations", name: "api_client_operations", methods: ["GET"])]
    public function getOperations(Client $client, Request $request, EntityManagerInterface $em, AccountTransactionRepository $repo): JsonResponse
    {
        $trans = $repo->findAll();
        $startDate = $request->query->get('dateFrom');
        $endDate = $request->query->get('dateTo');

        $repo = $em->getRepository(AccountTransaction::class);
        $qb = $repo->createQueryBuilder('t')
            ->where('t.client = :client')
            ->setParameter('client', $client);

        if ($startDate && $endDate) {
            $qb->andWhere('t.createdAt BETWEEN :start AND :end')
                ->setParameter('start', new \DateTime($startDate . ' 00:00:00'))
                ->setParameter('end', new \DateTime($endDate . ' 23:59:59'));
        }

        $qb->orderBy('t.createdAt', 'DESC');
        $transactions = $qb->getQuery()->getResult();



        $list = [];
        foreach ($transactions as $tx) {

            $operation = '';
            $ops_id = '';

            if ($tx->isInterClientTransfer()) {
                $operation = self::INTERCOMPTE_LABEL;
                $ops_id = $tx->getId();
            } else if ($tx->getType() && $tx->getType() !== "") {
                $operation = $tx->getType();
                $ops_id = $tx->getId();
            } else if ($tx->getTransfert()) {
                $operation = "Transfert";
                $ops_id = $tx->getTransfert()->getId();
            } else if ($tx->getExchange()) {
                $operation = "Change";
                $ops_id = $tx->getExchange()->getId();
            } else {
                $operation = "Inconnu";
                $ops_id = null;
            }

            $list[] = [
                'id'          => $tx->getId(),
                'ops_id'      => $ops_id,
                'date'        => $tx->getCreatedAt()->format('Y-m-d H:i:s'),
                'operation'   => $operation,
                'description' => $tx->getDescrib(),
                'montant'     => $tx->getActiveAmount() ?? $tx->getCFA(),
                'currency'    => $tx->getActiveCurrency(),
                'isInterClient' => $tx->isInterClientTransfer(),
            ];
        }

        return $this->json(['data' => $list]);

        return $this->Json([]);
    }
}
