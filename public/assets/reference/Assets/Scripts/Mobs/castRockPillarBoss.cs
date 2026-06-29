using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class castRockPillarBoss : MonoBehaviour
{
    public float damages;
    public float destroyTime;

    private GameObject player;
    private Animator anim;
    private AudioSource audio;

    private void Start()
    {
     player = GameObject.FindWithTag("Player");
        Destroy(gameObject, destroyTime);

//        audio.Play();
    }

    void OnCollisionEnter2D(Collision2D col)
    {
        if (col.gameObject.tag.Equals("Player"))
        {
            player.GetComponent<PlayerHealth>().TakeAHit(damages);
        }
        
    }
}
