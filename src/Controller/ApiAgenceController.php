<?php

namespace App\Controller;

use App\Entity\Agence;
use App\Repository\AgenceRepository;
use App\Repository\ExchangeRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;

final class ApiAgenceController extends AbstractController
{
    #[Route('/api/agences', name: 'app_api_agence', methods: ['GET'])]
    public function index(AgenceRepository $repository): JsonResponse
    {
        $agences = $repository->findAll();
        $data = array_map(function($agence) {
            return [
                'id' => $agence->getId(),
                'nom' => $agence->getDesignation(),
                'devise' => $agence->getDevise(),
                'localite' => $agence->getLocalite(),
                'isActive' => $agence->IsActive(),
                // Ajoutez d'autres propriétés nécessaires
            ];
        }, $agences);

        return new JsonResponse($data, Response::HTTP_OK);
    }

    #[Route('/api/agence/{id}', name: 'api_agence_show', methods: ['GET'])]
    public function show(Agence $agence): JsonResponse
    {
        $data = [
            'id' => $agence->getId(),
            'name' => $agence->getDesignation(),
            'isActive' => $agence->IsActive(),
            // Ajoutez d'autres propriétés nécessaires
        ];

        return new JsonResponse($data, Response::HTTP_OK);
    }

    #[Route('/api/agences', name: 'api_agence_create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em, ValidatorInterface $validator): JsonResponse
    { 
        $agence = new Agence();
        $agence->setDesignation($request->request->get('nom'));
        $agence->setDevise($request->request->get('devise'));
        $agence->setLocalite($request->request->get('localite'));
        $agence->setCreatedAt(new \DateTimeImmutable());
        $agence->setIsActive(true);

        $errors = $validator->validate($agence);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }
            return new JsonResponse(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        $em->persist($agence);
        $em->flush();

        return new JsonResponse([
            'id' => $agence->getId(),
            'name' => $agence->getDesignation(),
            'isActive' => $agence->IsActive(),
            // Ajoutez d'autres propriétés nécessaires
        ], Response::HTTP_CREATED);
    }

    #[Route('/api/agences/{id}', name: 'api_agence_update', methods: ['PUT'])]
    public function update(Agence $agence, Request $request, EntityManagerInterface $em, ValidatorInterface $validator): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $agence->setDesignation($data['name'] ?? $agence->getDesignation()); 
        $agence->setLocalite($data['localite'] ?? $agence->getLocalite());
        // Mettez à jour d'autres propriétés si nécessaire

        $errors = $validator->validate($agence);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }
            return new JsonResponse(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        $em->flush();

        return new JsonResponse([
            'id' => $agence->getId(),
            'name' => $agence->getDesignation(),
            'isActive' => $agence->isActive(),
            // Ajoutez d'autres propriétés nécessaires
        ], Response::HTTP_OK);
    }

    #[Route('/api/agences/{id}', name: 'api_agence_delete', methods: ['DELETE'])]
    public function delete(Agence $agence, EntityManagerInterface $em): JsonResponse
    {
        $em->remove($agence);
        $em->flush();

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/api/agences/{id}/activate', name: 'api_agence_activate', methods: ['PUT'])]
    public function activate(Agence $agence, EntityManagerInterface $em): JsonResponse
    {
        $agence->setIsActive(true);
        $em->flush();

        return new JsonResponse(['status' => 'Agence activée'], Response::HTTP_OK);
    }

    #[Route('/api/agences/{id}/desactivate', name: 'api_agence_desactivate', methods: ['PUT'])]
    public function desactivate(Agence $agence, EntityManagerInterface $em): JsonResponse
    {
        $agence->setIsActive(false);
        $em->flush();

        return new JsonResponse(['status' => 'Agence désactivée'], Response::HTTP_OK);
    }

        

}
