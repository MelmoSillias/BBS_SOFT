<?php

namespace App\Controller;

use App\Repository\AccountTransactionRepository;
use App\Repository\AgenceRepository;
use App\Repository\ExchangeRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class ReportController extends AbstractController
{
    #[Route('/dashboard/report', name: 'app_report')]
    public function index(AgenceRepository $repository): Response
    {
        $agences = $repository->findAll();
        $data = [];

        $data = array_merge($data, array_map(function ($agence) {
            return [
                'id' => $agence->getId(),
                'nom' => $agence->getDesignation(),
                'devise' => $agence->getDeviseLocal(),
                'localite' => $agence->getLocalite(),
                'isActive' => $agence->IsActive(),
                'createdAt' => $agence->getCreatedAt()->format('Y-m-d'),
                // Ajoutez d'autres propriétés nécessaires
            ];
        }, $agences));

        return $this->render('report/index.html.twig', [
            'controller_name' => 'ReportController',
            'agences' => $data,
        ]);
    }

    #[Route('/api/report', name: 'api_report_agence', methods: ['GET'])]
    public function report(
        Request $request,
        AccountTransactionRepository $txRepo,
        AgenceRepository $agenceRepository
    ): JsonResponse {
        $agenceId = $request->query->get('agenceId');
        $devise = $request->query->get('devise');
        $startDate = $request->query->get('startDate');
        $endDate = $request->query->get('endDate');

        // Validation de la devise
        $devises = ['CFA', 'AED', 'EUR', 'USD', 'GBP', 'CNY', 'MAD', 'DZD'];
        if (!in_array($devise, $devises)) {
            return new JsonResponse(['error' => 'Devise invalide'], 400);
        }

        // Conversion des dates
        $start = $startDate ? \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $startDate . ' 00:00:00') : null;
        $end = $endDate ? \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $endDate . ' 23:59:59') : null;

        // Validation des dates
        if (!$start || !$end) {
            return new JsonResponse(['error' => 'Dates invalides'], 400);
        }

        $agence = $agenceId ? $agenceRepository->find($agenceId) : null;

        // Calcul du solde initial (toutes les transactions avant la période)
        $soldeInitial = (float) $txRepo->getSoldeInitial($agence, $devise, $start);
        $init = $soldeInitial;

        $current_date = $start->format('Y-m-d');

        // Récupération des transactions selon les filtres
        $transactions = $txRepo->findByFilters($agence, $start, $end, $devise);

        // Formatage des données pour la réponse
        $formattedTransactions = [];
        $soldeCumulatif = $soldeInitial;

        foreach ($transactions as $transaction) {
            // Récupération du montant pour la devise spécifique
            $montant = (float) $transaction->{'get' . $devise}();
            if ($montant) {

                // Détermination du montant d'entrée et de sortie
                $entree = $montant > 0 ? $montant : 0;
                $sortie = $montant < 0 ? abs($montant) : 0;

                if ($current_date != $transaction->getCreatedAt()->format('Y-m-d'))
                {
                    $current_date = $transaction->getCreatedAt()->format('Y-m-d');
                    $soldeInitial = $soldeCumulatif;
                }

                // Calcul du solde cumulatif
                $soldeCumulatif += $montant;

                $formattedTransactions[] = [
                    'id' => $transaction->getId(),
                    'description' => $transaction->getDescrib(),
                    'date' => $transaction->getCreatedAt()->format('Y-m-d'),
                    'entree' => $entree,
                    'sortie' => $sortie,
                    'solde' => $soldeCumulatif,
                    'initial' => $soldeInitial
                ];
            }
        }

        return new JsonResponse(["data" => $formattedTransactions, "initial" => $init]);
    }
}
