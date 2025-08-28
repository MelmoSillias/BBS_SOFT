<?php

namespace App\Controller;

use App\Entity\CaseDocs;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use App\Entity\Client;
use App\Entity\Invoice;
use App\Entity\Task;
use App\Entity\User;
use App\Repository\CaseDocsRepository;
use App\Repository\InvoiceRepository;
use App\Repository\TaskRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

final class DashboardController extends AbstractController
{
    #[Route('/dashboard', name: 'app_dashboard')]
    public function index(): Response
    {
        return $this->render('dashboard/index.html.twig', [
            'controller_name' => 'DashboardController',
        ]);
    }

    
     #[Route('/dashboard/users/change-password', name: 'change_password', methods: ['POST'])]
    public function changePassword(
        Request $request,
        #[CurrentUser] User $user,
        UserPasswordHasherInterface $passwordHasher,
        EntityManagerInterface $em
    ): JsonResponse {
        // 1. Lecture du JSON
        try {
            $data = $request->toArray();
        } catch (\Throwable $e) {
            return $this->json([
                'success' => false,
                'message' => 'Payload JSON invalide.',
            ], 400);
        }

        $old     = $data['oldPassword']     ?? null;
        $new     = $data['newPassword']     ?? null;
        $confirm = $data['confirmPassword'] ?? null;

        // 2. Validation des champs
        if (! $old || ! $new || ! $confirm) {
            return $this->json([
                'success' => false,
                'message' => 'Tous les champs sont requis.',
            ], 422);
        }
        if (! $passwordHasher->isPasswordValid($user, $old)) {
            return $this->json([
                'success' => false,
                'message' => 'L’ancien mot de passe est incorrect.',
            ], 403);
        }
        if ($new !== $confirm) {
            return $this->json([
                'success' => false,
                'message' => 'La confirmation ne correspond pas.',
            ], 422);
        }

        // 3. Hash & persist
        $user->setPassword(
            $passwordHasher->hashPassword($user, $new)
        );
        $em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Mot de passe mis à jour avec succès.',
        ], 200);
    }

    #[Route('/api/datatable_json_fr', name: 'get_frjson_datatable', methods: ['GET'])]
    public function getDataTableFrJson(): JsonResponse
    {
        $filePath = $this->getParameter('kernel.project_dir') . '/public/utils/dataTables_fr-FR.json';

        if (!file_exists($filePath)) {
            return $this->json(['error' => 'File not found'], Response::HTTP_NOT_FOUND);
        }

        $data = file_get_contents($filePath);
        $jsonData = json_decode($data, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return $this->json(['error' => 'Invalid JSON format'], Response::HTTP_BAD_REQUEST);
        }

        return $this->json($jsonData);
    }

    public function __construct(
        private EntityManagerInterface $em,
     
    ) {}  
}
