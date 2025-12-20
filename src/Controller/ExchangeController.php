<?php

namespace App\Controller;

use App\Entity\AccountTransaction;
use App\Entity\Agence;
use App\Entity\Exchange;
use App\Repository\AgenceRepository;
use App\Repository\ExchangeRepository;
use DateTimeImmutable;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class ExchangeController extends AbstractController
{
    #[Route('/dashboard/exchange', name: 'app_exchange')]
    public function index(AgenceRepository $agenceRepository): Response
    {
        return $this->render('exchange/index.html.twig', [
            'controller_name' => 'ExchangeController',
            'agences' => $agenceRepository->findAll(),
            'clients' => [],
        ]);
    }

    #[Route('/api/exchanges', name: 'api_exchange_index', methods: ['GET'])]
    public function APIindex(Request $request, ExchangeRepository $repository, AgenceRepository $agenceRepository): JsonResponse
    { 
        $type = $request->query->get('type');
        $startDate = $request->query->get('startDate');
        $endDate = $request->query->get('endDate');

        // 🔹 On construit la requête directement ici
        $qb = $repository->createQueryBuilder('e');

        if ($type) {
            $qb->andWhere('e.type = :type')
                ->setParameter('type', $type);
        }

        if ($startDate) {
            $qb->andWhere('e.date >= :startDate')
                ->setParameter('startDate', new \DateTime($startDate));
        }

        if ($endDate) {
            $qb->andWhere('e.date <= :endDate')
                ->setParameter('endDate', new \DateTime($endDate));
        }

        $exchanges = $qb->getQuery()->getResult();

        $data = array_map(function ($ex) {
            return [
                'id' => $ex->getId(),
                'date' => $ex->getDate()->format('Y-m-d'),
                'type' => $ex->getType(),
                'clientId' => $ex->getClient() ? $ex->getClient()->getId() : null,
                'description' => $ex->getDescription(),
                'montantCFA' => $ex->getMontantCFA(),
                'montantDevise' => $ex->getMontantDevise(),
                'devise' => $ex->getDevise(),
                'taux' => $ex->getTaux(),
                'ref' => $ex->getRef(),
            ];
        }, $exchanges);

        return new JsonResponse(['data' => $data]);
    }

    #[Route('/api/exchanges/{exchange}', name: 'api_exchange_details', methods: ['GET'])]
    public function getExchangeDetails(Exchange $exchange, Request $request, ExchangeRepository $repository, AgenceRepository $agenceRepository): JsonResponse
    {  
        if (!$exchange) {
            return $this->Json(["error" => "Echange non disponible"], 404);
        } 

        $transactions = $exchange->getTransactions();
        $destination = 0;
        if (count($transactions) === 1){
            $destination = 1;
        } else if (count($transactions) === 2){
            $destination = $transactions[0]->getAgence()->getId() === 1 ? $transactions[1]->getAgence()->getId() : $transactions[0]->getAgence()->getId() ;
        }
    
        return new JsonResponse(['success' => true, 'data' => [
            'id' => $exchange->getId(),
            'date' => $exchange->getDate()->format('Y-m-d'),
            'type' => $exchange->getType(),
            'destination' => $destination,
            'description' => $exchange->getDescription(),
            'montantCFA' => $exchange->getMontantCFA(),
            'montantDevise' => $exchange->getMontantDevise(),
            'devise' => $exchange->getDevise(),
            'taux' => $exchange->getTaux(),
            'ref' => $exchange->getRef(),
        ]]);
    }

    #[Route('/api/exchanges', name: 'api_exchange_create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        // 1. Récupérer le contenu JSON de la requête
        $data = json_decode($request->getContent(), true);

        // 2. Valider et extraire les données
        $agenceId = isset($data['agence']) ? (int) $data['agence'] : null;
        $agence = $em->getRepository(Agence::class)->findOneBy(['id' => $agenceId]);
        $local = $em->getRepository(Agence::class)->findOneBy(['id' => 1]);

        if (!$agence) {
            return new JsonResponse(['error' => 'Agence introuvable'], Response::HTTP_BAD_REQUEST);
        }

        $type = $data['type'] ?? '';
        $montantdevise = isset($data['montant']) ? (float) $data['montant'] : 0.0;
        $devise = $data['deviseExchange'] ?? '';
        $description = $data['description'] ?? '';
        $date = $data['date'] ?? null; // Date de la transaction
        $taux = isset($data['taux']) ? (float) $data['taux'] : 0.0; // Taux de change utilisé

        // 3. Calculer le montant en CFA (arrondi au pas de 50)
        $montantCfa = $this->roundCFA($montantdevise * $taux); 
        // 4. Créer l'échange
        $exchange = new Exchange();
        $exchange->setMontantCFA($montantCfa);
        $exchange->setMontantDevise($montantdevise);
        $exchange->setRef($this->generateReference($em));
        $exchange->setDevise($devise);
        $exchange->setType($type);
        $exchange->setTaux($taux);
        $exchange->setDescription($description != "" ? $description : $type . " de " . $devise . " à " . $agence->getDesignation());
        $exchange->setDate(!$date ? new DateTimeImmutable("now") : new DateTimeImmutable($date));

        // 5. Générer une référence de paiement unique
        $ref_payment = uniqid('EXCH_', false);

        if ($agence->getId() == 1) {

            $tx = new AccountTransaction();
            $tx->setAgence($agence);
            $tx->setCFA($type === "achat" ? $montantCfa * -1 : $montantCfa);
            $tx->setAmount($devise, $type === "achat" ? $montantdevise : $montantdevise * -1);
            $tx->setDescrib($description != "" ? $description : $type . " de " . $devise . " à " . $agence->getDesignation());
            $tx->setExchange($exchange);
            $tx->setCreatedAt(!$date ? new DateTimeImmutable("now") : new DateTimeImmutable($date));

            $em->persist($tx);
        } else {
            $localtx = new AccountTransaction();
            $localtx->setAgence($local);
            $localtx->setCFA($type === "achat" ? $montantCfa * -1 : $montantCfa);
            $localtx->setDescrib($description != "" ? $description : $type . " de " . $devise . " à " . $agence->getDesignation());
            $localtx->setExchange($exchange);
            $localtx->setCreatedAt(!$date ? new DateTimeImmutable("now") : new DateTimeImmutable($date));
            $em->persist($localtx);

            $agencetx = new AccountTransaction();
            $agencetx->setAgence($agence);
            $agencetx->setAmount($devise, $type === "achat" ? $montantdevise : $montantdevise * -1);
            $agencetx->setDescrib($description != "" ? $description : $type . " de " . $devise . " à " . $agence->getDesignation());
            $agencetx->setExchange($exchange);
             $agencetx->setCreatedAt(!$date ? new DateTimeImmutable("now") : new DateTimeImmutable($date));
            $em->persist($agencetx);
        }

        // 7. Persister et sauvegarder en base de données
        $em->persist($exchange);
        // $em->persist($withdrawalTx);
        // $em->persist($depositTx);
        $em->flush();

        // 8. Retourner la réponse
        return new JsonResponse([
            'id' => $exchange->getId(),
        ], Response::HTTP_CREATED);
    }


    #[Route('/api/exchanges/{exchange}', name: 'api_exchange_update', methods: ['PUT'])]
    public function updateExchange(Exchange $exchange, Request $request, EntityManagerInterface $em): JsonResponse
    {
        if (!$exchange) {
            return $this->Json(["error" => "Echange non disponible"], 404);
        }

        // 1. Récupérer le contenu JSON de la requête
        $data = json_decode($request->getContent(), true);

        // 2. Valider et extraire les données
        $agenceId = isset($data['agence']) ? (int) $data['agence'] : null;
        $agence = $em->getRepository(Agence::class)->findOneBy(['id' => $agenceId]);
        $local = $em->getRepository(Agence::class)->findOneBy(['id' => 1]);

        if (!$agence) {
            return new JsonResponse(['error' => 'Agence introuvable'], Response::HTTP_BAD_REQUEST);
        }

        $type = $data['type'] ?? '';
        $montantdevise = isset($data['montant']) ? (float) $data['montant'] : 0.0;
        $devise = $data['deviseExchange'] ?? '';
        $description = $data['description'] ?? '';
        $date = $data['date'] ?? null; // Date de la transaction
        $taux = isset($data['taux']) ? (float) $data['taux'] : 0.0; // Taux de change utilisé

        // 3. Calculer le montant en CFA
        $montantCfa = $this->roundCFA($montantdevise * $taux);

        $exchange->setMontantCFA($montantCfa);
        $exchange->setMontantDevise($montantdevise); 
        $exchange->setDevise($devise);
        $exchange->setType($type);
        $exchange->setTaux($taux);
        $exchange->setDescription($description != "" ? $description : $type . " de " . $devise . " à " . $agence->getDesignation());
        $exchange->setDate(!$date ? new DateTimeImmutable("now") : new DateTimeImmutable($date));

        foreach($exchange->getTransactions() as $tx ){
            $em->remove($tx);
        }
        $em->flush();

        if ($agence->getId() == 1) {

            $tx = new AccountTransaction();
            $tx->setAgence($agence);
            $tx->setCFA($type === "achat" ? $montantCfa * -1 : $montantCfa);
            $tx->setAmount($devise, $type === "achat" ? $montantdevise : $montantdevise * -1);
            $tx->setDescrib($description != "" ? $description : $type . " de " . $devise . " à " . $agence->getDesignation());
            $tx->setExchange($exchange);
            $tx->setCreatedAt(!$date ? new DateTimeImmutable("now") : new DateTimeImmutable($date));
            $exchange->addTransaction($tx);
            $em->persist($tx);

        } else {
            
            $localtx = new AccountTransaction();
            $localtx->setAgence($local);
            $localtx->setCFA($type === "achat" ? $montantCfa * -1 : $montantCfa);
            $localtx->setDescrib($description != "" ? $description : $type . " de " . $devise . " à " . $agence->getDesignation());
            $localtx->setExchange($exchange);
            $localtx->setCreatedAt(!$date ? new DateTimeImmutable("now") : new DateTimeImmutable($date));
            $exchange->addTransaction($localtx);
            $em->persist($localtx); 

            $agencetx = new AccountTransaction();
            $agencetx->setAgence($agence);
            $agencetx->setAmount($devise, $type === "achat" ? $montantdevise : $montantdevise * -1);
            $agencetx->setDescrib($description != "" ? $description : $type . " de " . $devise . " à " . $agence->getDesignation());
            $agencetx->setExchange($exchange);
            $agencetx->setCreatedAt(!$date ? new DateTimeImmutable("now") : new DateTimeImmutable($date));
            $exchange->addTransaction($agencetx);
            $em->persist($agencetx);
        } 
        // 7. Persister et sauvegarder en base de données
        $em->persist($exchange);
        // $em->persist($withdrawalTx);
        // $em->persist($depositTx);
        $em->flush();

        // 8. Retourner la réponse
        return new JsonResponse([
            'id' => $exchange->getId(),
        ], Response::HTTP_OK);
    }

    #[Route('/api/exchanges/{id}', name: 'api_exchange_delete', methods: ['DELETE'])]
    public function delete(Exchange $exchange, EntityManagerInterface $em): JsonResponse
    {   
        $trans =  $exchange->getTransactions();

        foreach ($trans as $tran) {
            $em->remove($tran);
        }; 
        $em->remove($exchange);
        
        $em->flush();

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/api/exchanges/{id}/print', name: 'api_exchange_print', methods: ['GET'])]
    public function Print(Exchange $exchange, EntityManagerInterface $em): Response
    {
        return $this->render('exchange/print.html.twig', [
            'controller_name' => 'ExchangeController',
            'exchange' => $exchange
        ]);
    }

    #[Route('/api/exchanges/stats', name: 'api_exchange_stats', methods: ['GET'])]
    public function stats(ExchangeRepository $repository, Request $request): JsonResponse
    {
        $startDate = $request->query->get('startDate');
        $endDate = $request->query->get('endDate');
        $agenceId = $request->query->get('agence');

        $filters = [
            'startDate' => $startDate,
            'endDate' => $endDate,
            'agence' => $agenceId,
        ];

        $exchanges = $repository->findByFilters($filters);

        $total = count($exchanges);
        $completed = 0;
        $pending = 0;
        $cancelled = 0;
        $achat = 0;
        $vente = 0;
        $montantAchat = 0;
        $montantVente = 0;
        $tauxSum = 0;

        foreach ($exchanges as $exchange) {
            $completed++;


            if ($exchange->getType() === 'achat') {
                $achat++;
                $montantAchat += $exchange->getFromAmount();
            } else {
                $vente++;
                $montantVente += $exchange->getToAmount();
            }

            $tauxSum += $exchange->getTaux();
        }

        $tauxMoyen = $total > 0 ? round($tauxSum / $total, 6) : 0;

        // calcul du solde local (entrées - sorties)
        $localSolde = 0;
        foreach ($exchanges as $exchange) {
            if ($exchange->getType() === 'achat') {
                $localSolde += $exchange->getFromAmount();
                $localSolde -= $exchange->getToAmount();
            } else {
                $localSolde += $exchange->getToAmount();
                $localSolde -= $exchange->getFromAmount();
            }
        }

        return new JsonResponse([
            'total' => $total,
            'completed' => $completed,
            'pending' => $pending,
            'cancelled' => $cancelled,
            'achat' => $achat,
            'vente' => $vente,
            'montant_achat' => $montantAchat,
            'montant_vente' => $montantVente,
            'local_solde' => $localSolde,
            'taux_moyen' => $tauxMoyen,
        ]);
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

    
}
