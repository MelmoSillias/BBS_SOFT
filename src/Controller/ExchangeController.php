<?php

namespace App\Controller;

use App\Entity\AccountTransaction;
use App\Entity\Agence;
use App\Entity\Exchange;
use App\Repository\AgenceRepository;
use App\Repository\ExchangeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class ExchangeController extends AbstractController
{
    #[Route('/dashboard/exchange', name: 'app_exchange')]
    public function index(): Response
    {
        return $this->render('exchange/index.html.twig', [
            'controller_name' => 'ExchangeController',
            'agences' => [],
            'clients' => [],
        ]);
    }

    #[Route('/api/exchanges', name: 'api_exchange_index', methods: ['GET'])]
    public function APIindex(Request $request, ExchangeRepository $repository, AgenceRepository  $agenceRepository): JsonResponse
    {

        $agenceId = $request->request->get('agence');
        $agence = $agenceRepository->findOneBy(['id' => $agenceId]);

        $filters = [
            'type' => $request->query->get('type'),
            'agence' => $agence,
            'startDate' => $request->query->get('startDate'),
            'endDate' => $request->query->get('endDate'),
        ];

        $exchanges = $repository->findByFilters($filters);

        $data = array_map(function ($exchange) {
            return [
                'id' => $exchange->getId(),
                'type' => $exchange->getType(),
                'client' => $exchange->getVanishClientName(),
                'clientPhone' => $exchange->getVanishClientTel(),
                'agence' => [
                    'id' => $exchange->getAgence()->getId(),
                    'name' => $exchange->getAgence()->getDesignation(),
                    'devise' => $exchange->getAgence()->getDevise(),
                    // Ajoutez d'autres propriétés de l'agence nécessaires
                ],
                'date' => $exchange->getDate()->format('Y-m-d'),
                'fromAmount' => ($exchange->getType() == "achat") ? $exchange->getFromAmount() : $exchange->getToAmount(),
                'toAmount' => ($exchange->getType() == "achat") ? $exchange->getToAmount() : $exchange->getFromAmount(),
                'taux' => $exchange->getTaux(),
                'fromCurrency' => ($exchange->getType() == "achat") ? $exchange->getFromCurrency() : $exchange->getToCurrency(),
                'toCurrency' => ($exchange->getType() == "achat") ? $exchange->getToCurrency() : $exchange->getFromCurrency(),
                // Ajoutez d'autres propriétés de l'échange nécessaires
            ];
        }, $exchanges);

        return new JsonResponse(['data' => $data]);
    }

    #[Route('/api/exchanges', name: 'api_exchange_create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        // 1. Récupérer et valider l'agence
        $agenceId = $request->request->get('agence');
        $agence = $em->getRepository(Agence::class)->find($agenceId);
        if (!$agence) {
            return new JsonResponse(['error' => 'Agence introuvable'], Response::HTTP_BAD_REQUEST);
        }

        // 2. Récupérer les données de la requête
        $clientNom = $request->request->get('clientNom');
        $clientPhone = $request->request->get('clientPhone');
        $date = $request->request->get('date');
        $montant = (float) $request->request->get('montant');
        $taux = (float) $request->request->get('taux');
        $type = $request->request->get('type');

        // 3. Déterminer les devises selon le type d'échange
        $fromCurrency = ($type === 'achat') ? 'CFA' : $agence->getDevise();
        $toCurrency = ($type === 'achat') ? $agence->getDevise() : 'CFA';

        $fromAmount = ($type === 'achat') ?  $montant * $taux : $montant; 
        $toAmount = ($type === 'achat') ? $montant : $montant * $taux ; 

        // 4. Créer l'échange
        $exchange = new Exchange();
        $exchange->setAgence($agence);
        $exchange->setVanishClientName($clientNom);
        $exchange->setVanishClientTel($clientPhone);
        $exchange->setDate(new \DateTimeImmutable($date));
        $exchange->setFromAmount($fromAmount);
        $exchange->setFromCurrency($fromCurrency);
        $exchange->setToCurrency($toCurrency);
        $exchange->setToAmount($toAmount);
        $exchange->setTaux($taux);
        $exchange->setType($type);
        $exchange->setDescription('');

        // 5. Générer une référence de paiement unique
        $ref_payment = uniqid('EXCH_', false);

        // 6. Créer les transactions associées
        // Transaction de retrait
        $withdrawalTx = new AccountTransaction();
        $withdrawalTx->setClient(null) // À remplacer par la logique pour récupérer le client si nécessaire
            ->setIncome(0)
            ->setOutcome($fromAmount)
            ->setDevise($fromCurrency)
            ->setAccountType('local')
            ->setUpdatedAt(new \DateTimeImmutable())
            ->setReason("Échange de $fromCurrency à $toCurrency")
            ->setDescrib("Achat de $toCurrency")
            ->setPaymentRef($ref_payment)
            ->setStatus('validé')
            ->setCreatedAt(new \DateTimeImmutable())
            ->setPaymentMethod('Exchange')
            ->setExchange($exchange);

        // Transaction de dépôt
        $depositTx = new AccountTransaction();
        $depositTx->setClient(null) // À remplacer par la logique pour récupérer le client si nécessaire
            ->setIncome($toAmount)
            ->setOutcome(0)
            ->setDevise($toCurrency)
            ->setAccountType('local')
            ->setUpdatedAt(new \DateTimeImmutable())
            ->setReason("Échange de $fromCurrency à $toCurrency")
            ->setDescrib("Vente de $fromCurrency")
            ->setPaymentRef($ref_payment)
            ->setStatus('validé')
            ->setCreatedAt(new \DateTimeImmutable())
            ->setPaymentMethod('Exchange')
            ->setExchange($exchange);

        // 7. Persister et sauvegarder en base de données
        $em->persist($exchange);
        $em->persist($withdrawalTx);
        $em->persist($depositTx);
        $em->flush();

        // 8. Retourner la réponse
        return new JsonResponse([
            'id' => $exchange->getId(),
            'type' => $exchange->getType(),
            'agence' => $exchange->getAgence()->getId(),
            'date' => $exchange->getDate()->format('Y-m-d H:i:s'),
            'fromAmount' => $exchange->getFromAmount(),
            'fromCurrency' => $exchange->getFromCurrency(),
            'toAmount' => $exchange->getToAmount(),
            'toCurrency' => $exchange->getToCurrency(),
            'taux' => $exchange->getTaux(),
        ], Response::HTTP_CREATED);
    }


    #[Route('/api/exchanges/{id}/validate', name: 'api_exchange_validate', methods: ['PUT'])]
    public function validate(Exchange $exchange, EntityManagerInterface $em): JsonResponse
    {
        foreach ($exchange->getTransactions() as $transaction) {
            $transaction->setStatus('completed');
            $transaction->setValidateAt(new \DateTimeImmutable());
        }

        $em->flush();
        return new JsonResponse(['status' => 'Échange validé'], Response::HTTP_OK);
    }

    #[Route('/api/exchanges/{id}/cancel', name: 'api_exchange_cancel', methods: ['PUT'])]
    public function cancel(Exchange $exchange, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $reason = $request->request->get('reason', 'Annulé par l\'utilisateur');

        foreach ($exchange->getTransactions() as $transaction) {
            $transaction->setStatus('cancelled');
            $transaction->setReason($reason);
        }

        $em->flush();
        return new JsonResponse(['status' => 'Échange annulé'], Response::HTTP_OK);
    }

    #[Route('/api/exchanges/{id}', name: 'api_exchange_delete', methods: ['DELETE'])]
    public function delete(Exchange $exchange, EntityManagerInterface $em): JsonResponse
    {
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

        $tauxMoyen = $total > 0 ? round($tauxSum / $total, 2) : 0;

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
}
