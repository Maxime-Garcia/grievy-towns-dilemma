using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class NPC : MonoBehaviour {
	
    public float detectionRange = 1f;
    public bool hasSpoken;

    private bool DialogueOn = false;
    private Transform target;
    private string _tag;
   


    // Use this for initialization
    void Start () {
        target = GameObject.FindGameObjectWithTag("Player").transform;
        
        _tag = gameObject.tag;
    }

    // Update is called once per frame
    void Update () {
        
        // if the Player is near enough, the enemy will move towards him
        float distToPlayer = Vector3.Distance(target.position, transform.position);
        if (distToPlayer < detectionRange && Input.GetKeyDown("e"))
        {
            if(_tag == "Boss" && !hasSpoken)
            {
                GameObject.FindWithTag("Player").GetComponent<PlayerController>().BossStep++;
                gameObject.GetComponent<Dialogue>().currentStep = GameObject.FindWithTag("Player").GetComponent<PlayerController>().BossStep;
                hasSpoken = true;
            }
            
            DialogueOn = true;
            gameObject.GetComponent<DialogueTrigger>().TriggerDialogue(true);
        }
        if (distToPlayer > detectionRange && DialogueOn)
        {
            gameObject.GetComponent<DialogueTrigger>().TriggerDialogue(false);
            DialogueOn = false;
        }
    }
}